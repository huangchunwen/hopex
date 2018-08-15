import React, { Component } from 'react'
import { classNames, dealInterval, _, formatNumber, getPercent, Patterns } from '@utils'
import { Table, Mixin, Button, Toast } from '@components'
import { SCROLLX, TABLE } from '@constants'
import add from '@assets/add.png'
import substract from '@assets/substract.png'
import { editIcon } from '@assets'
import ScrollPannel from './components/ScrollPanel'
import RedGreenSwitch from './components/RedGreenSwitch'
import MainModal from './components/MainModal'
import styles from './index.less'


export default class View extends Component {
  state = {
    active: 0
  }
  startInit = () => {
    this.getPosition()
  }

  getPosition = () => {
    const { dispatch, modelName } = this.props
    dispatch({
      type: `${modelName}/getPosition`
    }).then(() => {
      if (!this._isMounted) return
      this.interval = dealInterval(() => {
        this.getPosition()
      })
    })
  }

  changeState = (payload) => {
    this.setState(payload)
  }

  render() {
    const { changeState } = this
    const { model: { positionList = [], }, modal: { name }, noDataTip, modelName, dispatch, openModal: prevOpenModal, } = this.props


    const openModal = () => {
      prevOpenModal({ name: 'positionMoney' })
    }
    const columns = [
      {
        title: '合约',
        dataIndex: 'marketName',
        render: (value) => ({
          value,
          className: 'blue'
        })
      },
      {
        title: '当前价格',
        dataIndex: 'lastPriceShow',
        // render: (v) => formatNumber(v, 'p')
      },
      {
        title: '当前合理价格',
        dataIndex: 'reasonablePriceShow',
        // render: (v) => formatNumber(v, 'p')
      },
      {
        title: '杠杆倍数',
        dataIndex: 'leverage',
      },
      {
        title: '数量(张)',
        dataIndex: 'amount',
        render: (value) => Number(value) >= 0 ? (
          <RedGreenSwitch.GreenText value={value} />
        ) : (<RedGreenSwitch.RedText value={value} />)
      },
      {
        title: '开仓均价',
        dataIndex: 'averagePriceShow',
        // render: (v) => formatNumber(v, 'p')
      },
      {
        title: '持仓占用保证金',
        dataIndex: 'positionMoneyShow',
        render: (v) => {
          return (
            <div className={styles.changepositionMoney} >
              <div onClick={() => {
                openModal()
                changeState({
                  active: 1
                })

              }} >
                <img src={substract} />
              </div >
              <div className={styles.positionMoney} >{v}</div >
              <div onClick={() => {
                openModal()
                changeState({
                  active: 0
                })

              }} >
                <img src={add} />
              </div >
            </div >
          )
        }
      },
      {
        title: '维持保证金',
        dataIndex: 'keepMoneyShow',
        //render: (v) => formatNumber(v, 10)
      },
      {
        title: '强平价格',
        dataIndex: 'overPriceShow',
        // render: (v) => formatNumber(v, 10)
      },
      {
        title: '浮动盈亏(收益率)',
        dataIndex: 'floatProfitShow',
        width: 200,
        render: (value, record = {}) => {
          const v = `${value}(${record.profitRate})`
          return Number(record.floatProfit) >= 0 ? (
            <RedGreenSwitch.GreenText value={v} />
          ) : (
            <RedGreenSwitch.RedText value={v} />
          )
        }
      },
      {
        title: '操作',
        width: 280,
        dataIndex: 'overPrice',
        render: (value, record = {}, index) => {
          return {
            value: (
              <div >
                <input value={record.inputValue || ''} onChange={(e) => {
                  if (Patterns.decimalNumber.test(e.target.value) || e.target.value === '') {
                    dispatch({
                      type: `${modelName}/doInputChangePosition`,
                      payload: {
                        market: record.market,
                        value: e.target.value
                      }
                    })
                  }
                }} />
                <span onClick={() => {
                  if (!record.inputValue) return Toast.tip('请填写价格')
                  dispatch({
                    type: `${modelName}/postSideOrder`,
                    payload: {
                      side: Number(record.amount) > 0 ? '1' : '2',
                      method: 'order.put_limit',
                      price: record.inputValue,
                      amount: String(Math.abs(Number(record.amount)))
                    }
                  })
                }} >
                  <Button layer={false} loading={false} loadingMargin='0 0 0 2px' >限价全平</Button >
                </span >
                <span >市价全平</span >
              </div >
            ),
            className: 'blue action'
          }
        }
      },
    ]
    const dataSource = positionList
    const tableProp = {
      className: styles.tableContainer,
      columns,
      dataSource: dataSource, //_.merge((new Array(4)).fill(), dataSource),
      scroll: {
        x: SCROLLX.X
      },
      noDataTip: () => noDataTip(dataSource, '当前无持仓'),
    }
    return (
      <Mixin.Child that={this} >
        <div
          className={
            classNames(
              {
                view: true
              },
              styles.position
            )
          }
        >
          <ScrollPannel
            tableHeight={TABLE.trHeight * (dataSource.length + 1)}
            header={
              <div >当前持仓</div >
            }
          >
            <Table {...tableProp}  />
          </ScrollPannel >
        </div >
        {
          name === 'positionMoney' ? (<RenderModal {...this.props} {...this.state} changeState={changeState} />) : null
        }
      </Mixin.Child >
    )
  }
}

class RenderModal extends Component {
  state = {
    inputValue: '',
    dealCurrency: '',
    increase: {},
    reduce: {}
  }

  changeState = (payload) => {
    this.setState(payload)
  }

  render() {
    const props = {
      ...this.props,
      title: '持仓占用保证金'
    }
    const { changeState: changeStateInModal } = this
    const { inputValue, dealCurrency = '', increase = {}, reduce = {} } = this.state
    const { changeState, active, dispatch, modelName, loading, closeModal } = this.props

    const currentObj = active === 0 ? increase : reduce
    const { maxChange = '', overPrice = '' } = currentObj || {}
    return (
      <MainModal {...props} className={styles.position_modal} >
        <div className={styles.header} >
          <ul >
            <li >
              <div
                className={classNames(
                  active === 0 ? styles.active : null
                )}
                onClick={() => {
                  changeState({
                    active: 0
                  })
                }} >
                增加保证金
              </div >
            </li >
            <li >
              <div
                className={classNames(
                  active === 1 ? styles.active : null
                )}
                onClick={() => {
                  changeState({
                    active: 1
                  })
                }} >
                减少保证金
              </div >
            </li >
          </ul >
        </div >
        <div className={styles.content} >
          <div className={styles.input} >
            <div className={styles.edit} >
              {editIcon}
              <input value={inputValue} onChange={
                _.throttle((e) => {
                  const value = e.target.value
                  changeStateInModal({
                    inputValue: value
                  })
                  dispatch({
                    type: `${modelName}/calculatePositionEnsureMoney`,
                    payload: {
                      marginChange: e.target.value
                    }
                  }).then((res) => {
                    if (res) {
                      const { dealcurrency: dealCurrency = '', increase = {}, reduce = {} } = res || {}
                      changeStateInModal({
                        dealCurrency,
                        increase,
                        reduce
                      })
                    }
                  })
                }, 10)
              } />
              <div >BTC</div >
            </div >
          </div >
          <ul className={styles.desc} >
            <li >
              最多{active === 0 ? '增加' : '减少'} :
              <div >{`${maxChange}${dealCurrency}`}</div >
            </li >
            <li >追加后的强平价格为 :
              <div >{`${overPrice}${dealCurrency}`}</div >
            </li >
          </ul >
        </div >
        <div className={styles.buttons} >
          <div
            onClick={() => {
              closeModal()
            }}
          >
            取消
          </div >
          <div
            className={styles.confirm}
            onClick={() => {
              dispatch({
                type: `${modelName}/doUpdatePositionEnsureMoney`,
                payload: {
                  assetName: dealCurrency,
                  assetChange: active === 1 ? `-${inputValue}` : inputValue
                }
              }).then((res) => {
                if (res) {
                  closeModal()
                }
              })

            }}
          >
            <Button layer={false} loading={loading.effects[`${modelName}/doUpdatePositionEnsureMoney`]} >
              确定
            </Button >

          </div >
        </div >
      </MainModal >
    )
  }
}


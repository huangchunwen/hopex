import { _, joinModel } from '@utils'
import modelExtend from '@models/modelExtend'

export default joinModel(modelExtend, {
  namespace: 'modal',
  state: {
    data: null,
    name: '',
    state: false,
  },

  effects: {
    * startInit({ payload = {} }, { call, put, select }) {

    },
  },
  reducers: {},
})

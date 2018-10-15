import Vue from "vue";
import { mapValues, keyBy, find } from "lodash";
import {
  ADD_FIELD,
  UPDATE_FIELD,
  REMOVE_FIELD,
  STORE_HYDRATED,
  HYDRATING_FAILED,
  LATENCY,
  SET_SETTINGS,
  SET_CURRENT_USER,
  UPDATE_CURRENT_USER,
  SET_COLLECTIONS,
  ADD_COLLECTION,
  DELETE_COLLECTION,
  UPDATE_COLLECTION,
  SET_BOOKMARKS,
  ADD_BOOKMARK,
  DELETE_BOOKMARK,
  TOGGLE_NAV,
  TOGGLE_INFO,
  LOADING_START,
  LOADING_FINISHED
} from "./mutation-types";

const mutations = {
  [STORE_HYDRATED](state, date) {
    state.hydrated = date;
  },

  [HYDRATING_FAILED](state, error) {
    state.hydrated = false;
    state.hydratingError = error;
  },

  [LATENCY](state, info) {
    const latencies = [...state.latency];
    latencies.push(info);

    if (latencies.length > 200) {
      latencies.shift();
    }

    state.latency = latencies;
  },

  [SET_SETTINGS](state, data) {
    state.settings = mapValues(keyBy(data, "key"), obj => obj.value);
  },

  [SET_CURRENT_USER](state, data) {
    state.currentUser = data;
  },

  [UPDATE_CURRENT_USER](state, data) {
    state.currentUser = {
      ...state.currentUser,
      ...data
    };
  },

  [SET_COLLECTIONS](state, data) {
    state.collections = mapValues(keyBy(data, "collection"), info => {
      const statusField = find(info.fields, { interface: "status" });
      let status_mapping =
        statusField &&
        statusField.options &&
        statusField.options.status_mapping;

      if (status_mapping && typeof status_mapping === "string") {
        status_mapping = JSON.parse(status_mapping);
      }

      return {
        ...info,
        status_mapping
      };
    });
  },

  [ADD_COLLECTION](state, collection) {
    state.collections = {
      ...state.collections,
      [collection.collection]: collection
    };
  },

  [DELETE_COLLECTION](state, collection) {
    const copy = { ...state.collections };
    delete copy[collection];

    state.collections = copy;
  },

  [UPDATE_COLLECTION](state, { collection, edits }) {
    state.collections = {
      ...state.collections,
      [collection]: {
        ...state.collections[collection],
        ...edits
      }
    };
  },

  [SET_BOOKMARKS](state, data) {
    state.bookmarks = data;
  },

  [ADD_BOOKMARK](state, bookmark) {
    state.bookmarks = [...state.bookmarks, bookmark];
  },

  [DELETE_BOOKMARK](state, id) {
    state.bookmarks = state.bookmarks.filter(bookmark => bookmark.id !== id);
  },

  [TOGGLE_NAV](state, active = !state.sidebars.nav) {
    state.sidebars.nav = active;
  },

  [TOGGLE_INFO](state, active = !state.sidebars.info) {
    state.sidebars.info = active;
  },

  [LOADING_START](state, { id, desc }) {
    state.queue = [...state.queue, { id, desc }];
  },

  [LOADING_FINISHED](state, id) {
    state.queue = state.queue.filter(req => req.id !== id);
  },

  [ADD_FIELD](state, { collection, field }) {
    Vue.set(state.collections[collection], "fields", {
      ...state.collections[collection].fields,
      [field.field]: field
    });
  },

  [UPDATE_FIELD](state, { collection, field }) {
    Vue.set(state.collections[collection], "fields", {
      ...state.collections[collection].fields,
      [field.field]: field
    });
  },

  [REMOVE_FIELD](state, { collection, field }) {
    const clone = Object.assign({}, state.collections[collection].fields);
    delete clone[field];
    Vue.set(state.collections[collection], "fields", clone);
  }
};

export default mutations;

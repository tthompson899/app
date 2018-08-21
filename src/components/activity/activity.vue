<template>
  <div class="v-activity">
    <form
      v-show="(commentPermission !== 'none' && commentPermission !== 'read') && (show !== 'activity')"
      class="new-comment"
      @submit.prevent="postComment">

      <v-textarea
        v-model="comment"
        class="textarea"
        :rows="5"
        required
        :placeholder="$t('leave_comment')" />

      <button type="submit">{{ $t('submit') }}</button>
    </form>

    <article
      v-for="(activity, index) in activityWithChanges"
      class="activity-item"
      :key="activity.id">
      <i
        v-if="activity.action && activity.action.toLowerCase() === 'comment'"
        v-tooltip="$t('comment')"
        class="material-icons">message</i>
      <span
        v-else
        v-tooltip="$helpers.formatTitle(activity.action)"
        :class="activity.action"
        class="indicator" />

      <div class="content">
        <details v-if="activity.action !== 'external' && activity.changes && activity.name">
          <summary class="title">{{ activity.name }}<span v-if="activity.date">•</span><v-timeago
            v-if="activity.date"
            v-tooltip="{ content: $d(activity.date, 'long'), delay: {show: 1500, hide: 100}  }"
            :auto-update="1"
            :since="activity.date"
            :locale="$i18n.locale"
            class="date" />
          <i
            class="material-icons chevron"
            v-tooltip="'Revision Details'">chevron_left</i></summary>
          <div v-if="activity.changes">
            <v-diff :changes="activity.changes" />
            <button
              v-if="index !== 0"
              v-tooltip="$t('revert')"
              class="revert"
              @click="$emit('revert', activity)"><i class="material-icons">restore</i></button>
          </div>
        </details>
        <div class="title" v-else-if="activity.name">{{ activity.name }}<span v-if="activity.date">•</span><v-timeago
          v-if="activity.date"
          v-tooltip="{ content: $d(activity.date, 'long'), delay: {show: 1500, hide: 100} }"
          :auto-update="1"
          :since="activity.date"
          :locale="$i18n.locale"
          class="date" /></div>
        <p v-if="activity.htmlcomment" v-html="activity.htmlcomment" :class="{ comment: activity.action && activity.action.toLowerCase() === 'comment' }"></p>
      </div>
    </article>
  </div>
</template>

<script>
import VDiff from "./diff.vue";

export default {
  name: "v-activity",
  components: {
    VDiff
  },
  data() {
    return {
      comment: ""
    };
  },
  props: {
    activity: {
      type: Array,
      required: true
    },
    revisions: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    show: {
      type: String,
      default: "both"
    },
    commentPermission: {
      type: String,
      default: "none"
    }
  },
  computed: {
    activityFiltered() {
      switch (this.show) {
        case "comments":
          return this.commentPermission === "none"
            ? []
            : this.activity.filter(item => item.comment !== null);
        case "activity":
          return this.activity.filter(item => item.comment === null);
        case "both":
        default:
          return this.activity.filter(item => {
            if (this.commentPermission === "none") {
              if (item.comment != null) return false;
            }

            return true;
          });
      }
    },
    activityWithChanges() {
      const activityWithChanges = this.activityFiltered.map((activity, i) => ({
        ...activity,
        changes: this.getChanges(activity.id, i),
        revision: this.revisions[activity.id]
      }));

      const lastItem =
        activityWithChanges &&
        activityWithChanges[activityWithChanges.length - 1];

      if (
        !lastItem ||
        (lastItem.action.toLowerCase() !== "create" && this.show !== "comments")
      ) {
        activityWithChanges.push({
          action: "external",
          comment: this.$t("activity_outside_directus"),
          id: -1
        });
      }

      return activityWithChanges.map(activity => ({
        ...activity,
        htmlcomment: this.$helpers.snarkdown(
          ((activity.comment || "").replace(/#/g, "") || "").trim()
        )
      }));
    }
  },
  methods: {
    getChanges(activityID, index) {
      const revision = this.revisions[activityID];

      if (!revision) return null;

      let previousUpdate = null;

      for (let i = index + 1; i < this.activityFiltered.length; i++) {
        if (
          this.activityFiltered[i].action === "update" ||
          this.activityFiltered[i].action === "create"
        ) {
          previousUpdate = this.activityFiltered[i];
          break;
        }
      }

      if (!previousUpdate) return null;

      const previousRevision = this.revisions[previousUpdate.id];
      const previousData = (previousRevision && previousRevision.data) || {};
      const currentDelta = revision.delta;

      return this.$lodash.mapValues(currentDelta, (value, field) => ({
        before: previousData[field],
        after: value,
        field
      }));
    },
    postComment() {
      this.$emit("input", this.comment);
      this.comment = "";
    }
  }
};
</script>

<style lang="scss" scoped>
.v-activity {
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 6px;
    height: 100%;
    width: 1px;
    background-color: var(--lightest-gray);
    z-index: -1;
  }

  .indicator {
    position: relative;
    top: 1px;
    display: inline-block;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 2px solid;
    background-color: var(--white);
    box-shadow: 0 0 0 5px var(--white);
    flex-shrink: 0;

    &.update {
      border-color: var(--action);
    }
    &.delete {
      border-color: var(--danger);
    }
    &.add {
      border-color: var(--success);
    }
    &.external {
      border-color: var(--gray);
    }
  }

  i.material-icons {
    width: 13px;
    background-color: var(--white);
    font-size: 24px;
    transform: translateX(-6px);
    height: 20px;
    color: var(--lighter-gray);
  }

  article {
    display: flex;
    margin-bottom: 30px;
  }

  .content {
    margin-left: 10px;
    flex-grow: 1;

    .title {
      list-style-type: none;

      &::-webkit-details-marker {
        display: none;
      }

      span,
      .date {
        color: var(--light-gray);
      }

      span {
        margin: 0 5px;
      }
    }

    summary {
      cursor: pointer;

      &:hover {
        .chevron {
          color: var(--dark-gray);
        }
      }

      .chevron {
        float: right;
        color: var(--lighter-gray);
        transition: all var(--fast) var(--transition);
      }
    }

    > *:not(:first-child) {
      margin-top: 10px;
    }

    .revert {
      transition: all var(--fast) var(--transition);
      background-color: var(--lightest-gray);
      border-radius: var(--border-radius);
      padding: 4px;
      margin: 14px auto;
      width: 100%;
      &:hover {
        background-color: var(--lighter-gray);
        i.material-icons {
          color: var(--dark-gray);
        }
      }
      i.material-icons {
        width: auto;
        height: auto;
        transform: translateX(0);
        background-color: inherit;
        font-size: 24px;
        color: var(--gray);
      }
    }

    .comment {
      position: relative;
      background-color: var(--lightest-gray);
      color: var(--light-gray);
      border-radius: var(--border-radius);
      padding: 8px 10px;
      display: inline-block;
      min-width: 36px;
      // max-height: 400px;
      &:before {
        content: "";
        position: absolute;
        top: -6px;
        left: 10px;
        display: inline-block;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 8px 6px 8px;
        border-color: transparent transparent var(--lightest-gray) transparent;
      }
      a {
        color: var(--accent);
        text-decoration: none;
        &:hover {
          color: var(--accent-dark);
        }
      }
      strong {
        font-weight: 600;
      }
      code {
        font-family: "Roboto Mono";
        color: var(--gray);
        font-weight: 600;
      }
      pre {
        font-family: "Roboto Mono";
        color: var(--gray);
        font-weight: 600;
        background-color: var(--lighter-gray);
        padding: 4px 6px;
        border-radius: var(--border-radius);
        margin: 4px 0;
      }
      ul,
      ol {
        margin: 4px 0;
        padding-left: 25px;
      }
      blockquote {
        font-size: 1.2em;
        font-weight: 400;
        margin: 20px 10px 20px 10px;
        border-left: 2px solid var(--accent);
        padding-left: 10px;
        color: var(--accent);
        line-height: 1.4em;
      }
      hr {
        margin: 20px 0;
        height: 1px;
        border: none;
        background-color: var(--lighter-gray);
      }
    }
  }

  details[open] .chevron {
    transform: rotate(-90deg);
    transform-origin: 50% 60%;
  }
}

.new-comment {
  position: relative;
  height: var(--input-height);
  transition: height var(--slow) var(--transition);
  margin-bottom: 30px;

  .textarea {
    height: 100%;
    resize: none;
    box-shadow: 0px 5px 0px 0px rgba(255, 255, 255, 1);
  }

  button {
    position: absolute;
    bottom: 10px;
    right: 10px;
    color: var(--lighter-gray);
    cursor: not-allowed;
    background-color: var(--white);
    text-transform: uppercase;
    font-weight: 700;
    font-size: 0.875rem;
    transition: var(--fast) var(--transition);
    transition-property: color, opacity;
    opacity: 0;
  }

  &:valid button {
    color: var(--accent);
    cursor: pointer;
    &:hover {
      color: var(--accent-dark);
    }
  }

  &:focus,
  &:focus-within {
    height: calc(3 * var(--input-height));

    button {
      opacity: 1;
    }
  }
}
</style>

<style lang="scss">
.v-activity .content .comment {
  a {
    color: var(--accent);
    text-decoration: none;
    &:hover {
      color: var(--accent-dark);
    }
  }
  strong {
    font-weight: 600;
    color: var(--gray);
  }
  code {
    font-family: "Roboto Mono";
    color: var(--gray);
    font-weight: 600;
  }
  pre {
    font-family: "Roboto Mono";
    color: var(--gray);
    font-weight: 600;
    background-color: var(--lighter-gray);
    padding: 4px 6px;
    border-radius: var(--border-radius);
    margin: 10px 0;
  }
  ul,
  ol {
    margin: 10px 0;
    padding-left: 25px;
  }
  blockquote {
    font-size: 1.2em;
    font-weight: 400;
    margin: 20px 10px 20px 10px;
    border-left: 2px solid var(--accent);
    padding-left: 10px;
    color: var(--accent);
    line-height: 1.4em;
  }
  hr {
    margin: 20px 0;
    height: 1px;
    border: none;
    background-color: var(--lighter-gray);
  }
}
</style>

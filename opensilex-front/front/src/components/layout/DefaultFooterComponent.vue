<template>
  <div id="footer">FOOTER</div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import Vue from 'vue';

@Component
export default class DefaultFooterComponent extends Vue {
}
</script>

<style scoped lang="scss">
@import "../../../styles/styles";

#footer {
    padding: 15px;
    text-align: center;
    background-color: getVar(--highlightBackgroundColorLight);
    color: getVar(--defaultColorDark);
}
</style>

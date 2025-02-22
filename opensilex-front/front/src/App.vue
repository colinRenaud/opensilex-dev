<template>
  <div id="page-wrapper">
    <header v-if="!embed">
      <div id="header-content">
        <component class="header-logo" v-bind:is="headerComponent"></component>
        <component class="header-login" v-bind:is="loginComponent"></component>
      </div>
    </header>
    <section id="content-wrapper">
      <component v-if="!embed" v-bind:is="menuComponent"></component>
      <main>
        <router-view />
      </main>
    </section>
    <footer v-if="!embed">
      <component v-bind:is="footerComponent"></component>
    </footer>
    <div id="loader" v-bind:class="{'visible':isLoaderVisible}">
      <div class="lds-ripple">
        <div></div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component as ComponentAnnotation, Prop } from "vue-property-decorator";
import Vue from "vue";
import { ModuleComponentDefinition } from "./models/ModuleComponentDefinition";
import { VueConstructor, Component } from "vue";
import { OpenSilexVuePlugin } from "./models/OpenSilexVuePlugin";
import { FrontConfigDTO } from "./lib";

@ComponentAnnotation
export default class App extends Vue {
  @Prop() embed: boolean;

  @Prop() headerComponent!: string | Component;
  @Prop() loginComponent!: string | Component;
  @Prop() menuComponent!: string | Component;
  @Prop() footerComponent!: string | Component;

  $opensilex: OpenSilexVuePlugin;

  get user() {
    return this.$store.state.user;
  }

  get isLoaderVisible() {
    return this.$store.state.loaderVisible;
  }
}
</script>

<style lang="scss">
@import "../styles/styles";

#loader {
  display: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  width: 100%;
  z-index: 32000;
  background-color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

#loader .lds-ripple {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
  top: 50%;
  transform: translateY(-50%);
  margin: auto;
}
#loader .lds-ripple div {
  position: absolute;
  border: 4px solid #000;
  opacity: 1;
  border-radius: 50%;
  animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}
#loader .lds-ripple div:nth-child(2) {
  animation-delay: -0.5s;
}
@keyframes lds-ripple {
  0% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 0px;
    left: 0px;
    width: 72px;
    height: 72px;
    opacity: 0;
  }
}

#loader.visible {
  display: block;
}

#page-wrapper {
  min-height: 100vh;
  flex-direction: column;
  display: -webkit-flex;
  display: flex;
  margin: auto;
}

header {
  padding: 5px 30px;
  min-height: 50px;
  color: white;
  display: flex;
  background-color: getVar(--highlightBackgroundColorLight);
  color: getVar(--defaultColorDark);
}

main {
  background-color: getVar(--defaultColorLight);
  color: getVar(--defaultColorDark);
}

#header-content {
  max-width: 1600px;
  margin: auto;
  display: flex;
  width: 100%;
}

#header-content .header-logo {
  width: 70%;
}

#header-content .header-login {
  width: 30%;
  text-align: right;
}
#header-content .header-login * {
  text-align: initial;
}

section#content-wrapper {
  display: -webkit-flex;
  display: flex;
  margin: 0 auto;
  height: 100%;
  flex-grow: 1;
  width: 100%;
}

main {
  padding: 15px;
  width: 100%;
}

@media (max-width: 600px) {
  section#content-wrapper {
    -webkit-flex-direction: column;
    flex-direction: column;
  }

  #header-content .header-login {
    text-align: left;
  }

  #page-wrapper {
    min-width: 100vw;
    display: inline-flex;
  }
}
</style>

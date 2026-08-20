<script setup>
import SampleOne from './components/practices/basic/SampleOne.vue'
import SampleTwo from './components/practices/basic/SampleTwo.vue'
import vHtml from './components/vHtml.vue'
import vHtmlXSS from './components/vHtmlXSS.vue'
import vText from './components/vText.vue'
import vBind from './components/vBindBasic.vue'
import vBindClassBinding from './components/vBindClassBinding.vue'
import vBindStyleBinding from './components/vBindStyleBinding.vue'
import vBindShorthand from './components/vBindShorthand.vue'
import vIfElse from './components/vIfElse.vue'
import vShow from './components/vShow.vue'
import vFor from './components/vFor.vue'
import vPre from './components/vPre.vue'
import vCloak from './components/vCloak.vue'
import vOnce from './components/vOnce.vue'
import vMemo from './components/vMemo.vue'
import vOnEventHandler from './components/vOnEventHandler.vue'
import vOnEventObject from './components/vOnEventObject.vue'
import vOnEventModifier from './components/vOnEventModifier.vue'
import Task1WhetherMockup from './components/Task1WhetherMockup.vue'
import Task2WeatherComposition from './components/Task2WeatherComposition.vue'
import vModelFormDataBinding from './components/vModelFormDataBinding.vue'
import vModelModifier from './components/vModelModifier.vue'
import vStyleScoped from './components/vStyleScoped.vue'
import vReactiveRef from './components/vReactiveRef.vue'
import vReactiveReactive from './components/vReactiveReactive.vue'
import vComputedBasic from './components/vComputedBasic.vue'
import vWatchBasic from './components/vWatchBasic.vue'
import vWatchMulti from './components/vWatchMulti.vue'
import vWatchDeep from './components/vWatchDeep.vue'
import vWatchReactive from './components/vWatchReactive.vue'
import vWatchEffect from './components/vWatchEffect.vue'
</script>

<template>
  <div class="practice-container">
    <Task1WhetherMockup />
    <br />
    <hr />
    <br />

    <Task2WeatherComposition />
    <br />
    <hr />
    <br />

    <SampleOne />
    <br />
    <hr />
    <br />

    <SampleTwo />
    <br />
    <hr />
    <br />

    <vHtml />
    <br />
    <hr />
    <br />

    <vHtmlXSS />
    <br />
    <hr />
    <br />

    <vText />
    <br />
    <hr />
    <br />

    <vBind />
    <br />
    <hr />
    <br />

    <vBindClassBinding />
    <br />
    <hr />
    <br />

    <vBindStyleBinding />
    <br />
    <hr />
    <br />

    <vBindShorthand />
    <br />
    <hr />
    <br />

    <vIfElse />
    <br />
    <hr />
    <br />

    <vShow />
    <br />
    <hr />
    <br />

    <vFor />
    <br />
    <hr />
    <br />

    <vPre />
    <br />
    <hr />
    <br />

    <vCloak />
    <br />
    <hr />
    <br />

    <vOnce />
    <br />
    <hr />
    <br />

    <vMemo />
    <br />
    <hr />
    <br />

    <vOnEventHandler />
    <br />
    <hr />
    <br />

    <vOnEventObject />
    <br />
    <hr />
    <br />

    <vOnEventModifier />
    <br />
    <hr />
    <br />

    <vModelFormDataBinding />
    <br />
    <hr />
    <br />

    <vModelModifier />
    <br />
    <hr />
    <br />

    <vStyleScoped />
    <br />
    <hr />
    <br />

    <vReactiveRef />
    <br />
    <hr />
    <br />

    <vReactiveReactive />
    <br />
    <hr />
    <br />

    <vComputedBasic />
    <br />
    <hr />
    <br />

    <vWatchBasic />
    <br />
    <hr />
    <br />

    <vWatchMulti />
    <br />
    <hr />
    <br />

    <vWatchDeep />
    <br />
    <hr />
    <br />

    <vWatchReactive />
    <br />
    <hr />
    <br />

    <vWatchEffect />
    <br />
    <hr />
    <br />
  </div>
</template>

<style>
@import '@/assets/practice.css';
</style>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>

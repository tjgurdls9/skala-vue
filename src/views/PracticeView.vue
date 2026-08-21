<script setup>
import SampleOne from '../components/practice/basic/SampleOne.vue'
import SampleTwo from '../components/practice/basic/SampleTwo.vue'
import vHtml from '../components/practice/render/vHtml.vue'
import vHtmlXSS from '../components/practice/render/vHtmlXSS.vue'
import vText from '../components/practice/render/vText.vue'
import vBind from '../components/practice/binding/vBindBasic.vue'
import vBindClassBinding from '../components/practice/binding/vBindClassBinding.vue'
import vBindStyleBinding from '../components/practice/binding/vBindStyleBinding.vue'
import vBindShorthand from '../components/practice/binding/vBindShorthand.vue'
import vIfElse from '../components/practice/render/vIfElse.vue'
import vShow from '../components/practice/render/vShow.vue'
import vFor from '../components/practice/render/vFor.vue'
import vPre from '../components/practice/optimize/vPre.vue'
import vCloak from '../components/practice/optimize/vCloak.vue'
import vOnce from '../components/practice/optimize/vOnce.vue'
import vMemo from '../components/practice/optimize/vMemo.vue'
import vOnEventHandler from '../components/practice/event/vOnEventHandler.vue'
import vOnEventObject from '../components/practice/event/vOnEventObject.vue'
import vOnEventModifier from '../components/practice/event/vOnEventModifier.vue'
import vModelFormDataBinding from '../components/practice/event/vModelFormDataBinding.vue'
import vModelModifier from '../components/practice/event/vModelModifier.vue'
import vStyleScoped from '../components/practice/event/vStyleScoped.vue'
import vReactiveRef from '../components/practice/composition/vReactiveRef.vue'
import vReactiveReactive from '../components/practice/composition/vReactiveReactive.vue'
import vComputedBasic from '../components/practice/composition/vComputedBasic.vue'
import vWatchBasic from '../components/practice/composition/vWatchBasic.vue'
import vWatchMulti from '../components/practice/composition/vWatchMulti.vue'
import vWatchDeep from '../components/practice/composition/vWatchDeep.vue'
import vWatchReactive from '../components/practice/composition/vWatchReactive.vue'
import vWatchEffect from '../components/practice/composition/vWatchEffect.vue'
import vLifecycleHook from '../components/practice/component/vLifecycleHook.vue'
import vPropsEmits from '../components/practice/component/vPropsEmits.vue'
import SlotDefaultParent from '../components/practice/component/SlotDefaultParent.vue'
import SlotNamedParent from '../components/practice/component/SlotNamedParent.vue'
import SlotScopedParent from '../components/practice/component/SlotScopedParent.vue'
import StoreCounter from '../components/practice/store/StoreCounter.vue'
</script>

<template>
  <div class="practice-container">
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

    <vLifecycleHook />
    <br />
    <hr />
    <br />

    <vPropsEmits />
    <br />
    <hr />
    <br />

    <SlotDefaultParent />
    <br />
    <hr />
    <br />

    <SlotNamedParent />
    <br />
    <hr />
    <br />

    <SlotScopedParent />
    <br />
    <hr />
    <br />

    <StoreCounter />
    <br />
    <hr />
    <br />
  </div>
</template>

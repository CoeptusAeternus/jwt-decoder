import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import JwtInputPanel from "./JwtInputPanel.vue";

const ContainerStub = defineComponent({
  template: "<div><slot /></div>",
});

const QInputStub = defineComponent({
  name: "q-input",
  props: {
    label: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  template:
    "<button class=\"q-input-stub\" :data-label=\"label\" @click=\"$emit('update:modelValue', label === 'JWT' ? 'next-token' : 'next-secret')\" />",
});

const QBtnStub = defineComponent({
  name: "q-btn",
  emits: ["click"],
  template:
    '<button class="q-btn-stub" @click="$emit(\'click\')"><slot /></button>',
});

describe("JwtInputPanel", () => {
  it("emits updates for token and shared secret inputs", async () => {
    const wrapper = mount(JwtInputPanel, {
      props: {
        modelValue: "",
        sharedSecret: "",
      },
      global: {
        stubs: {
          "q-card": ContainerStub,
          "q-card-section": ContainerStub,
          "q-card-actions": ContainerStub,
          "q-input": QInputStub,
          "q-btn": QBtnStub,
        },
      },
    });

    const inputs = wrapper.findAll(".q-input-stub");
    await inputs[0]?.trigger("click");
    await inputs[1]?.trigger("click");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["next-token"]);
    expect(wrapper.emitted("update:sharedSecret")?.[0]).toEqual([
      "next-secret",
    ]);
  });

  it("emits clear when clear button is clicked", async () => {
    const wrapper = mount(JwtInputPanel, {
      props: {
        modelValue: "abc",
        sharedSecret: "secret",
      },
      global: {
        stubs: {
          "q-card": ContainerStub,
          "q-card-section": ContainerStub,
          "q-card-actions": ContainerStub,
          "q-input": QInputStub,
          "q-btn": QBtnStub,
        },
      },
    });

    await wrapper.get(".q-btn-stub").trigger("click");

    expect(wrapper.emitted("clear")).toBeTruthy();
    expect(wrapper.emitted("clear")?.length).toBe(1);
  });
});

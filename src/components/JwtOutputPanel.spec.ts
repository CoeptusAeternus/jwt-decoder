import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import JwtOutputPanel from "./JwtOutputPanel.vue";

const ContainerStub = defineComponent({
  template: "<div><slot /></div>",
});

const QChipStub = defineComponent({
  props: {
    color: { type: String, default: "" },
  },
  template: '<span class="chip" :data-color="color"><slot /></span>',
});

function mountPanel(
  overrides: Partial<InstanceType<typeof JwtOutputPanel>["$props"]> = {},
) {
  return mount(JwtOutputPanel, {
    props: {
      headerRows: [],
      payloadRows: [],
      signatureRows: [],
      validationState: "idle",
      validationMessages: ["Validation runs automatically while you type."],
      ...overrides,
    },
    global: {
      stubs: {
        "q-card": ContainerStub,
        "q-card-section": ContainerStub,
        "q-markup-table": ContainerStub,
        "q-separator": true,
        "q-chip": QChipStub,
      },
    },
  });
}

describe("JwtOutputPanel", () => {
  it("shows placeholder messages when no rows are available", () => {
    const wrapper = mountPanel();

    expect(wrapper.text()).toContain("Enter a token to decode header data.");
    expect(wrapper.text()).toContain("Enter a token to decode claim data.");
    expect(wrapper.text()).toContain(
      "Signature details appear after token parsing.",
    );
  });

  it("renders decoded rows and formats exp as unix + ISO date", () => {
    const exp = 1_800_000_000;
    const wrapper = mountPanel({
      headerRows: [{ field: "alg", value: "HS256" }],
      payloadRows: [
        { field: "sub", value: "alice" },
        { field: "exp", value: exp },
      ],
      signatureRows: [{ field: "verified", value: "yes" }],
      validationState: "valid",
      validationMessages: ["Token structure and signature checks passed."],
    });

    expect(wrapper.text()).toContain("HS256");
    expect(wrapper.text()).toContain("alice");
    expect(wrapper.text()).toContain(String(exp));
    expect(wrapper.text()).toContain(new Date(exp * 1000).toISOString());
    expect(wrapper.text()).toContain("yes");
  });

  it("renders status chip text and color for invalid state", () => {
    const wrapper = mountPanel({
      validationState: "invalid",
      validationMessages: [
        "Signature verification failed for provided shared secret.",
      ],
    });

    const chip = wrapper.get(".chip");
    expect(chip.attributes("data-color")).toBe("negative");
    expect(chip.text()).toBe("Invalid");
    expect(wrapper.text()).toContain(
      "Signature verification failed for provided shared secret.",
    );
  });

  it("renders array claims as expandable lists", async () => {
    // 0 items
    let wrapper = mountPanel({ payloadRows: [{ field: "arr", value: [] }] });
    let summary = wrapper.get("summary");
    expect(summary.text()).toContain("0 items");
    expect(wrapper.findAll(".claim-list li").length).toBe(0);

    // 1 item
    wrapper = mountPanel({ payloadRows: [{ field: "arr", value: ["one"] }] });
    summary = wrapper.get("summary");
    expect(summary.text()).toContain("1 item");
    expect(summary.text()).toContain("one");
    expect(wrapper.findAll(".claim-list li").length).toBe(1);

    // 2 items
    wrapper = mountPanel({
      payloadRows: [{ field: "arr", value: ["one", "two"] }],
    });
    summary = wrapper.get("summary");
    expect(summary.text()).toContain("2 items");
    expect(summary.text()).toContain("one");
    expect(summary.text()).toContain("two");
    expect(wrapper.findAll(".claim-list li").length).toBe(2);

    // more than 2 items
    wrapper = mountPanel({
      payloadRows: [{ field: "arr", value: ["a", "b", "c"] }],
    });
    summary = wrapper.get("summary");
    expect(summary.text()).toContain("3 items");
    expect(summary.text()).toContain("a");
    expect(summary.text()).toContain("b");
    expect(summary.text()).toContain("...");
    expect(wrapper.findAll(".claim-list li").length).toBe(3);

    // icon reflects open state when toggled
    const details = wrapper.get(".claim-list");
    const toggle = wrapper.get(".list-toggle");
    expect(toggle.classes()).not.toContain("open");
    details.element.open = true;
    await details.trigger("toggle");
    await wrapper.vm.$nextTick();
    // after toggle handler runs, class should be present
    expect(wrapper.get(".list-toggle").classes()).toContain("open");
  });
});

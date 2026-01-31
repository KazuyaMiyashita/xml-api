import { XMLAPI } from "./xml-api";
import { ChangeEvent } from "./xml-api-events";

describe("XMLAPI Event System", () => {
  it("should emit event on setAttribute", () => {
    const api = new XMLAPI('<root id="1" />');
    const events: ChangeEvent[] = [];

    api.on((e) => events.push(e));

    const root = api.ast!;
    api.setAttribute(root, "id", "2");

    expect(events.length).toBeGreaterThan(0);
    // Ideally we want specific event types, but for now just check emission
    // Current implementation might dispatch generic "structure" or "full" depending on logic
  });

  it("should emit event on updateText", () => {
    const api = new XMLAPI("<root>Old</root>");
    const events: ChangeEvent[] = [];
    api.on((e) => events.push(e));

    const root = api.ast!;
    api.updateText(root, "New");

    expect(events.length).toBeGreaterThan(0);
  });
});

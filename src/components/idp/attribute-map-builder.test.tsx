import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { AttributeMapBuilder, type IdpFormValues } from "./attribute-map-builder";

function patchPointerCapture() {
  for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
    if (typeof (Element.prototype as unknown as Record<string, unknown>)[method] !== "function") {
      Object.defineProperty(Element.prototype, method, {
        value: method === "hasPointerCapture" ? () => false : () => undefined,
        configurable: true,
      });
    }
  }
  if (typeof (Element.prototype as unknown as Record<string, unknown>).scrollIntoView !== "function") {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      value: () => undefined,
      configurable: true,
    });
  }
}

function Harness({ initialMappings }: { initialMappings?: IdpFormValues["attributeMapping"] }) {
  const form = useForm<IdpFormValues>({
    defaultValues: {
      protocol: "saml",
      name: "",
      issuer: "",
      metadata_url: "",
      certificate: "",
      client_id: "",
      client_secret: "",
      attributeMapping: initialMappings ?? [],
      enabled: true,
    },
  });
  return <AttributeMapBuilder control={form.control} />;
}

describe("AttributeMapBuilder", () => {
  beforeEach(() => {
    patchPointerCapture();
  });

  it("renders an empty state hint when there are no mappings", () => {
    render(<Harness />);
    expect(screen.getByTestId("no-mappings")).toBeInTheDocument();
  });

  it("adds a mapping row with a provider attribute input and user-field select", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByTestId("add-mapping"));

    expect(screen.getByLabelText("Provider attribute")).toBeInTheDocument();
    expect(screen.getByLabelText("User field")).toBeInTheDocument();
    expect(screen.getByLabelText("Remove mapping")).toBeInTheDocument();
  });

  it("removes a mapping row", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByTestId("add-mapping"));
    expect(screen.getByLabelText("Provider attribute")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Remove mapping"));
    expect(screen.queryByLabelText("Provider attribute")).not.toBeInTheDocument();
    expect(screen.getByTestId("no-mappings")).toBeInTheDocument();
  });

  it("pre-fills existing mappings from the idp", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialMappings={[
          { providerAttribute: "email", localField: "email" },
          { providerAttribute: "name", localField: "name" },
        ]}
      />,
    );

    const inputs = screen.getAllByLabelText("Provider attribute");
    expect(inputs[0]).toHaveValue("email");
    expect(inputs[1]).toHaveValue("name");
    expect(screen.queryByTestId("no-mappings")).not.toBeInTheDocument();

    const removeButtons = await screen.findAllByLabelText("Remove mapping");
    expect(removeButtons).toHaveLength(2);
    void user;
  });
});

import Select from "@/components/ui/Select";

export default function StoreFilter({
  stores = [],
  value,
  onChange,
  label = "Store",
  allLabel = "All Stores"
}) {
  const options = [
    { label: allLabel, value: "all" },
    ...stores.map((store) => ({
      label:
        store.role === "admin"
          ? `${store.storeCode} · Admin Data`
          : `${store.storeCode} · ${store.storeName}`,
      value: store.storeCode
    }))
  ];

  return <Select label={label} value={value} onChange={onChange} options={options} />;
}

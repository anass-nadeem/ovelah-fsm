"use client";

import { useEffect, useRef, useState } from "react";

export type QuotationRow = {
  id: string;
  item_id: number | null;
  description: string;
  qty: number;
  uom: string;
  unit_rate: number;
};

type Item = {
  id: number;
  description: string;
  uom: string;
  default_rate: number | null;
  is_active: boolean;
};

type Props = {
  rows: QuotationRow[];
  onChange: (rows: QuotationRow[]) => void;
  title?: string;
  subtitle?: string;
};

const API_URL = "http://127.0.0.1:8000";

export default function QuotationItemsTable({
  rows,
  onChange,
  title = "Quotation Items",
  subtitle = "Search an existing item or enter a manual item.",
}: Props) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/items/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load items: ${response.status}`
          );
        }

        return response.json();
      })
      .then((data) => {
        setItems(data);
      })
      .catch((error) => {
        console.error("Failed to load items:", error);
      });
  }, []);

  function addRow() {
    onChange([
      ...rows,
      {
        id: crypto.randomUUID(),
        item_id: null,
        description: "",
        qty: 1,
        uom: "",
        unit_rate: 0,
      },
    ]);
  }

  function removeRow(id: string) {
    onChange(
      rows.filter((row) => row.id !== id)
    );
  }

  function updateRow(
    id: string,
    field: keyof QuotationRow,
    value: string | number | null
  ) {
    onChange(
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  }

  function selectItem(
    rowId: string,
    item: Item
  ) {
    onChange(
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              item_id: item.id,
              description: item.description,
              uom: item.uom,
              unit_rate: item.default_rate ?? 0,
            }
          : row
      )
    );
  }

  function clearSelectedItem(rowId: string) {
    onChange(
      rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              item_id: null,
            }
          : row
      )
    );
  }

  function amount(row: QuotationRow) {
    return row.qty * row.unit_rate;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>

          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          + Add Row
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-14 px-3 py-3 text-left font-semibold text-gray-600">
                Sr.
              </th>

              <th className="min-w-[280px] px-3 py-3 text-left font-semibold text-gray-600">
                Description
              </th>

              <th className="w-24 px-3 py-3 text-left font-semibold text-gray-600">
                Qty
              </th>

              <th className="w-28 px-3 py-3 text-left font-semibold text-gray-600">
                UOM
              </th>

              <th className="w-36 px-3 py-3 text-left font-semibold text-gray-600">
                Unit Rate
              </th>

              <th className="w-36 px-3 py-3 text-right font-semibold text-gray-600">
                Amount
              </th>

              <th className="w-16 px-3 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <QuotationItemRow
                key={row.id}
                row={row}
                index={index}
                items={items}
                onSelectItem={selectItem}
                onClearItem={clearSelectedItem}
                onUpdate={updateRow}
                onRemove={removeRow}
                amount={amount}
              />
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  No items added yet.
                  <br />
                  Click{" "}
                  <strong>+ Add Row</strong>{" "}
                  to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        You can select and copy table rows normally using your
        mouse and keyboard.
      </p>
    </div>
  );
}


// ============================================================
// ITEM ROW
// ============================================================

type QuotationItemRowProps = {
  row: QuotationRow;
  index: number;
  items: Item[];
  onSelectItem: (
    rowId: string,
    item: Item
  ) => void;
  onClearItem: (rowId: string) => void;
  onUpdate: (
    id: string,
    field: keyof QuotationRow,
    value: string | number | null
  ) => void;
  onRemove: (id: string) => void;
  amount: (row: QuotationRow) => number;
};

function QuotationItemRow({
  row,
  index,
  items,
  onSelectItem,
  onClearItem,
  onUpdate,
  onRemove,
  amount,
}: QuotationItemRowProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Where the dropdown should sit on screen. Recalculated whenever
  // it opens, and kept in sync on scroll/resize while it's open.
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const containerRef =
    useRef<HTMLDivElement>(null);

  function updateDropdownPosition() {
    const rect =
      containerRef.current?.getBoundingClientRect();

    if (!rect) return;

    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    window.addEventListener(
      "scroll",
      updateDropdownPosition,
      true
    );

    window.addEventListener(
      "resize",
      updateDropdownPosition
    );

    return () => {
      window.removeEventListener(
        "scroll",
        updateDropdownPosition,
        true
      );

      window.removeEventListener(
        "resize",
        updateDropdownPosition
      );
    };
  }, [isOpen]);

  // Keep search text synchronized with the selected
  // item's description.
  useEffect(() => {
    if (row.item_id !== null) {
      setSearch(row.description);
    }
  }, [row.item_id, row.description]);

  // Close dropdown when clicking outside. The dropdown below is
  // still a normal DOM child of this container (just visually
  // positioned with `fixed`), so this original check still works
  // unchanged.
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const searchTerm = search
    .trim()
    .toLowerCase();

  const filteredItems = items.filter(
    (item) => {
      if (!item.is_active) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return item.description
        .toLowerCase()
        .includes(searchTerm);
    }
  );

  function handleSearchChange(
    value: string
  ) {
    setSearch(value);
    setIsOpen(true);

    // If the user starts manually editing the
    // description, it is no longer tied to the
    // selected master item.
    if (row.item_id !== null) {
      onClearItem(row.id);
    }

    onUpdate(
      row.id,
      "description",
      value
    );
  }

  function handleSelect(item: Item) {
    onSelectItem(row.id, item);
    setSearch(item.description);
    setIsOpen(false);
  }

  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="px-3 py-3 align-top text-gray-500">
        {index + 1}
      </td>

      <td className="px-3 py-3">
        <div
          ref={containerRef}
          className="relative"
        >
          <input
            value={search}
            onChange={(e) =>
              handleSearchChange(
                e.target.value
              )
            }
            onFocus={() => {
              setIsOpen(true);
            }}
            placeholder="Search item description..."
            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-gray-900"
          />

          {isOpen && dropdownStyle && (
            <div
              style={{
                position: "fixed",
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
                zIndex: 9999,
              }}
              className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    className="block w-full border-b border-gray-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {item.description}
                    </div>

                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>
                        UOM: {item.uom}
                      </span>

                      <span>
                        Rate:{" "}
                        {(
                          item.default_rate ??
                          0
                        ).toLocaleString(
                          "en-PK"
                        )}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  No matching items found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-400">
          {row.item_id !== null
            ? "Master item selected"
            : "Manual item"}
        </div>
      </td>

      <td className="px-3 py-3 align-top">
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.qty === 0 ? "" : String(row.qty)}
          onChange={(e) =>
            onUpdate(
              row.id,
              "qty",
              Number(e.target.value)
            )
          }
          className="w-full rounded-md border border-gray-200 px-2 py-2 outline-none focus:border-gray-900"
        />
      </td>

      <td className="px-3 py-3 align-top">
        <input
          value={row.uom}
          onChange={(e) =>
            onUpdate(
              row.id,
              "uom",
              e.target.value
            )
          }
          placeholder="Ea / Job"
          className="w-full rounded-md border border-gray-200 px-2 py-2 outline-none focus:border-gray-900"
        />
      </td>

      <td className="px-3 py-3 align-top">
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.unit_rate}
          onChange={(e) =>
            onUpdate(
              row.id,
              "unit_rate",
              Number(e.target.value)
            )
          }
          className="w-full rounded-md border border-gray-200 px-2 py-2 text-right outline-none focus:border-gray-900"
        />
      </td>

      <td className="px-3 py-3 text-right align-top font-medium text-gray-900">
        {amount(row).toLocaleString("en-PK")}
      </td>

      <td className="px-3 py-3 align-top">
        <button
          type="button"
          onClick={() =>
            onRemove(row.id)
          }
          className="rounded-md px-2 py-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          title="Delete row"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
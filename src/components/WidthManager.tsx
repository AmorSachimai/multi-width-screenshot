import { type FunctionComponent, useState } from "react";

type WidthManagerProps = {
  availableWidths: number[];
  selectedWidths: number[];
  onChange: (available: number[], selected: number[]) => void;
};

export const WidthManager: FunctionComponent<WidthManagerProps> = ({
  availableWidths,
  selectedWidths,
  onChange,
}) => {
  const [newWidth, setNewWidth] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleAdd = () => {
    const width = Number.parseInt(newWidth, 10);
    if (Number.isNaN(width) || width < 200 || width > 4000) return;
    if (availableWidths.includes(width)) return;

    const newAvailable = [...availableWidths, width].sort((a, b) => a - b);
    const newSelected = [...selectedWidths, width];
    onChange(newAvailable, newSelected);
    setNewWidth("");
  };

  const handleToggle = (width: number) => {
    const newSelected = selectedWidths.includes(width)
      ? selectedWidths.filter((w) => w !== width)
      : [...selectedWidths, width];
    onChange(availableWidths, newSelected);
  };

  const handleRemove = (width: number) => {
    const newAvailable = availableWidths.filter((w) => w !== width);
    const newSelected = selectedWidths.filter((w) => w !== width);
    onChange(newAvailable, newSelected);
  };

  const startEditing = (index: number, value: number) => {
    setEditingIndex(index);
    setEditValue(value.toString());
  };

  const saveEdit = (index: number) => {
    const width = Number.parseInt(editValue, 10);
    if (Number.isNaN(width) || width < 200 || width > 4000) {
      setEditingIndex(null);
      return;
    }

    const oldWidth = availableWidths[index];
    const newAvailable = availableWidths
      .map((w, i) => (i === index ? width : w))
      .sort((a, b) => a - b);

    const newSelected = selectedWidths.includes(oldWidth)
      ? selectedWidths.map((w) => (w === oldWidth ? width : w))
      : selectedWidths;

    onChange(newAvailable, newSelected);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">
          Target Resolution (Width)
        </h3>
        <span className="text-[10px] text-gray-500">
          {selectedWidths.length} selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {availableWidths.map((width, index) => (
          <div
            key={width}
            className={`group relative flex items-center p-2 rounded-lg border transition-all ${
              selectedWidths.includes(width)
                ? "bg-purple-500/10 border-purple-500/50"
                : "bg-white/5 border-white/10 opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedWidths.includes(width)}
              onChange={() => handleToggle(width)}
              className="w-3 h-3 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-transparent"
            />

            <div className="ml-3 flex-1 flex items-center">
              {editingIndex === index ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(index)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(index)}
                  className="w-16 bg-gray-800 text-white text-xs px-1 rounded border border-purple-500 focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  className="text-xs font-mono cursor-pointer hover:text-purple-400 focus:outline-none focus:text-purple-400"
                  onClick={() => startEditing(index, width)}
                >
                  {width}px
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRemove(width)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Remove</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="number"
          placeholder="Add width (px)"
          value={newWidth}
          onChange={(e) => setNewWidth(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newWidth}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 rounded-lg text-xs font-bold transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
};

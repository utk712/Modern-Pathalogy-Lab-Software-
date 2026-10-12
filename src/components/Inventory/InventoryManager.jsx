import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Search,
  Package,
  Layers,
  ArrowDownCircle
} from 'lucide-react';

export const InventoryManager = () => {
  const { inventory, updateInventoryStock } = useLab();
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [addTestsCount, setAddTestsCount] = useState('');

  const filteredInventory = (inventory || []).filter(i =>
    (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.lotNo || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedItem || !addTestsCount || Number(addTestsCount) === 0) return;
    updateInventoryStock(selectedItem.id, Number(addTestsCount));
    setSelectedItem(null);
    setAddTestsCount('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Reagents, Calibrators & Consumables Inventory</h1>
            <p className="text-xs text-slate-500">Auto-deduction per test processed, LOT/batch traceability, and minimum reorder threshold alarms</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reagent, LOT or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => {
              const name = prompt("Enter Reagent / Consumable Name:");
              if (!name) return;
              const code = prompt("Enter Reagent Code (e.g. REAG-01):", `REAG-${Math.floor(Math.random() * 90 + 10)}`);
              const stock = prompt("Enter Initial Stock Test Count:", "500");
              if (name && stock) {
                const newItem = {
                  id: `INV-${Date.now()}`,
                  code: code || `REAG-${Date.now().toString().slice(-4)}`,
                  name,
                  department: 'HAEMATOLOGY',
                  stockTests: Number(stock) || 100,
                  minThreshold: 50,
                  status: 'IN_STOCK',
                  lotNo: `LOT-${new Date().getFullYear()}-01`,
                  expiryDate: '2027-12-31'
                };
                updateInventoryStock(newItem.id, Number(stock));
              }
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Reagent</span>
          </button>
        </div>
      </div>

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map(item => {
          const isLow = item.stockTests <= item.minThreshold;
          const isCritical = item.stockTests <= item.minThreshold / 2;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isCritical ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse' :
                    isLow ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3">{item.name}</h3>
                <p className="text-xs text-slate-400 uppercase font-semibold mt-0.5">{item.department}</p>

                {/* Stock Details */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Available Stock:</span>
                    <span className={`font-mono font-black text-sm ${isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                      {item.stockTests} Tests
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Min Reorder Level:</span>
                    <span className="font-semibold text-slate-700">{item.minThreshold} Tests</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                    <span className="text-slate-500">LOT #: <strong className="text-slate-700">{item.lotNo || 'LOT-2026-01'}</strong></span>
                    <span className="text-slate-500">Exp: <strong className="text-slate-700">{item.expiryDate || item.expiry || '2027-12-31'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs border border-amber-200 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Receive Stock Shipment</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Update Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleStockUpdate} className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-amber-600">
              <Package className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900">Add Reagent Kit Shipment</h3>
            </div>

            <p className="text-xs text-slate-600">
              Item: <strong>{selectedItem.name}</strong> ({selectedItem.code})
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <span className="text-slate-500">Current Stock:</span>
              <span className="font-mono font-bold text-slate-900">{selectedItem.stockTests} Tests</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Number of Tests to Add <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 500"
                value={addTestsCount}
                onChange={(e) => setAddTestsCount(e.target.value)}
                className="w-full text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20"
              >
                Update Stock Count
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

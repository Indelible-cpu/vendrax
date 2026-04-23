import React from 'react';
import type { LocalProduct } from '../db/posDB';

interface ReceiptProps {
  items: { product: LocalProduct; quantity: number }[];
  total: number;
  subtotal: number;
  tax: number;
  invoiceNo: string;
  date: string;
  paid: number;
  change: number;
  mode: string;
}

export const Receipt: React.FC<ReceiptProps> = ({ items, total, subtotal, tax, invoiceNo, date, paid, change, mode }) => {
  const shopName = localStorage.getItem('companyName') || 'VENDRAX';
  const shopAddress = 'Excellence in Service'; // Default
  const shopTel = '+265 999 000 000';

  return (
    <div className="receipt p-6 bg-white text-black font-mono w-[80mm] mx-auto text-[11px] leading-tight">
      <div className="text-center border-b border-black pb-4 mb-4">
        <h1 className="text-lg font-black  tracking-tighter">{shopName}</h1>
        <p className="text-[9px]  tracking-widest">{shopAddress}</p>
        <p className="text-[9px] font-bold mt-1">TEL: {shopTel}</p>
      </div>

      <div className="flex justify-between mb-4 font-bold  text-[9px]">
        <span>INV: {invoiceNo}</span>
        <span>{new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>

      <table className="w-full mb-4 border-b border-black border-dashed">
        <thead className="border-b border-black">
          <tr className=" text-[9px]">
            <th className="text-left pb-1">Item</th>
            <th className="text-center pb-1">Qty</th>
            <th className="text-right pb-1">Total</th>
          </tr>
        </thead>
        <tbody className="pt-2">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 pr-2">
                <div className="font-bold ">{item.product.name}</div>
                <div className="text-[9px]">MK {item.product.sellPrice.toLocaleString()}</div>
              </td>
              <td className="text-center py-1 font-bold">{item.quantity}</td>
              <td className="text-right py-1 font-bold">MK {(item.product.sellPrice * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 font-bold  text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>MK {subtotal.toLocaleString()}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between">
            <span>Tax (VAT)</span>
            <span>MK {tax.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-black border-t border-black pt-1 mt-1">
          <span>Total</span>
          <span>MK {total.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 pt-2 border-t border-black border-dotted space-y-1 text-[10px]">
        <div className="flex justify-between font-bold">
          <span>Paid ({mode})</span>
          <span>MK {paid.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Change</span>
          <span>MK {change.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center mt-6 border-t border-black border-dashed pt-4">
        <p className="text-[9px] font-bold italic">Goods once sold are not returnable</p>
        <p className="text-[11px] font-black  mt-2">Thank you for your business!</p>
        <div className="mt-4 opacity-50 text-[8px]">Powered by Vendrax Cloud POS</div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .receipt, .receipt * { visibility: visible; }
          .receipt { 
            position: fixed; 
            left: 0; 
            top: 0; 
            width: 80mm;
            padding: 0;
            margin: 0;
          }
          @page { size: 80mm auto; margin: 0; }
        }
      `}} />
    </div>
  );
};

import React from 'react';
import type { LocalProduct } from '../db/posDB';

interface InvoiceProps {
  items: { product: LocalProduct; quantity: number }[];
  total: number;
  subtotal: number;
  tax: number;
  invoiceNo: string;
  date: string;
  customerName?: string;
}

export const Invoice: React.FC<InvoiceProps> = ({ items, total, subtotal, tax, invoiceNo, date, customerName }) => {
  const shopName = localStorage.getItem('companyName') || 'VENDRAX';
  
  return (
    <div className="invoice relative p-6 bg-white text-black font-mono w-[80mm] mx-auto text-[11px] border-4 border-double border-black leading-tight">
      <div className="absolute top-2 right-2 border border-black px-2 py-0.5 font-black text-[8px] uppercase tracking-tighter">
        Credit Invoice
      </div>
      
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-lg font-black uppercase tracking-tighter">{shopName}</h1>
        <p className="text-[9px] uppercase tracking-widest italic">Official Credit Note</p>
      </div>

      <div className="mb-4 text-[9px] space-y-1">
        <div className="font-bold uppercase">Invoice: {invoiceNo}</div>
        <div className="uppercase">Date: {new Date(date).toLocaleString()}</div>
      </div>

      <div className="mb-4 space-y-1 p-2 bg-zinc-50 border border-black border-dotted">
        <div className="flex gap-2 items-center">
            <span className="font-black text-[9px] min-w-[60px] uppercase">Client:</span>
            <span className="font-bold">{customerName || 'N/A'}</span>
        </div>
      </div>

      <table className="w-full mb-4 border-b border-black border-dashed">
        <thead className="border-b border-black text-[9px] uppercase">
          <tr>
            <th className="text-left pb-1">Item</th>
            <th className="text-center pb-1">Qty</th>
            <th className="text-right pb-1">Total</th>
          </tr>
        </thead>
        <tbody className="pt-2">
          {items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1">
                <div className="font-bold uppercase">{item.product.name}</div>
                <div className="text-[9px]">MK {item.product.sellPrice.toLocaleString()}</div>
              </td>
              <td className="text-center py-1 font-bold">{item.quantity}</td>
              <td className="text-right py-1 font-bold">MK {(item.product.sellPrice * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 font-bold uppercase text-[10px] mb-6">
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
        <div className="flex justify-between text-base font-black border-t-2 border-black pt-1 mt-1">
          <span>Balance due</span>
          <span>MK {total.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="w-32 mx-auto border-t border-black mb-1"></div>
        <p className="text-[9px] font-black uppercase">Authorized Signature</p>
      </div>

      <div className="text-center pt-4 mt-4 border-t border-black border-dashed">
        <p className="text-[9px] font-bold uppercase">Payment expected by due date.</p>
        <p className="text-[11px] font-black uppercase mt-2">Thank you for your business!</p>
        <div className="mt-4 opacity-50 text-[7px]">Powered by Vendrax Cloud POS</div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .invoice, .invoice * { visibility: visible; }
          .invoice { 
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

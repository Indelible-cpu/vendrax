import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { differenceInDays } from 'date-fns';

export const listCredits = async (_req: Request, res: Response) => {
  try {
    const credits = await prisma.sale.findMany({
      where: {
        isCredit: true,
        status: { not: 'DELETED' },
      },
      include: {
        customer: {
          select: {
            fullname: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results = credits.map((cr: any) => {
      const total = Number(cr.total);
      const paid = Number(cr.paid);
      const dueDate = cr.dueDate ? new Date(cr.dueDate) : null;
      const today = new Date();
      
      let interest = 0;
      let daysLate = 0;

      if (dueDate && today > dueDate && paid < total) {
        daysLate = differenceInDays(today, dueDate);
        // 2% per day interest from legacy logic
        interest = total * 0.02 * daysLate;
      }

      return {
        id: cr.id,
        invoice_no: cr.invoiceNo,
        customer_name: cr.customer?.fullname || 'Unknown',
        customer_phone: cr.customer?.phone || '',
        original_amount: total,
        paid_amount: paid,
        due_date: cr.dueDate,
        days_late: daysLate,
        interest: Math.round(interest * 100) / 100,
        current_total: Math.round((total + interest) * 100) / 100,
        status: paid >= (total + interest) ? 'Paid' : (daysLate > 0 ? 'Late' : 'Pending'),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Credits fetched",
      data: results,
    });
  } catch (error: any) {
    console.error('List Credits Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch credits', error: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  const { id, amount } = req.body;

  if (!id || !amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Invalid payment data" });
  }

  try {
    await prisma.sale.update({
      where: { id },
      data: {
        paid: {
          increment: Number(amount),
        },
      },
    });

    return res.status(200).json({
        success: true,
        message: "Payment recorded successfully",
    });
  } catch (error: any) {
    console.error('Record Payment Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
  }
};

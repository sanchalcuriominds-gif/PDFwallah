import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalPdfs,
      publishedPdfs,
      totalOrders,
      paidOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      db.pdf.count(),
      db.pdf.count({ where: { published: true } }),
      db.order.count(),
      db.order.count({ where: { status: 'paid' } }),
      db.order.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      db.order.findMany({
        where: { status: 'paid' },
        include: { pdf: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      totalPdfs,
      publishedPdfs,
      totalOrders,
      paidOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

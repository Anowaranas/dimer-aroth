import { db } from './index.ts';
import { users, shopProfiles, baseRates, parties, memos, suppliers, chalans, expenses, cloudBackups } from './schema.ts';
import { eq } from 'drizzle-orm';
import type { UserCloudData } from '../types.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('User synchronization failed', { cause: error });
  }
}

/**
 * Save complete application snapshot to Cloud SQL / Supabase PostgreSQL database
 */
export async function saveAppCloudData(uid: string, email: string, data: UserCloudData) {
  try {
    // 1. Ensure user exists
    await getOrCreateUser(uid, email);

    // 2. Save snapshot record in cloud_backups
    const totalRecords = (data.parties?.length || 0) + (data.memos?.length || 0) + (data.suppliers?.length || 0) + (data.supplierChalans?.length || 0) + (data.expenses?.length || 0);
    
    await db.insert(cloudBackups).values({
      userId: uid,
      backupDataJson: JSON.stringify(data),
      totalRecords,
    });

    // 3. Upsert Shop Profile
    if (data.shopProfile) {
      const existingProfile = await db.select().from(shopProfiles).where(eq(shopProfiles.userId, uid));
      if (existingProfile.length > 0) {
        await db.update(shopProfiles)
          .set({
            name: data.shopProfile.name,
            tagline: data.shopProfile.tagline,
            proprietor: data.shopProfile.proprietor,
            mobile: data.shopProfile.mobile,
            address: data.shopProfile.address,
            memoFooter: data.shopProfile.memoFooter,
            updatedAt: new Date(),
          })
          .where(eq(shopProfiles.userId, uid));
      } else {
        await db.insert(shopProfiles).values({
          userId: uid,
          name: data.shopProfile.name,
          tagline: data.shopProfile.tagline,
          proprietor: data.shopProfile.proprietor,
          mobile: data.shopProfile.mobile,
          address: data.shopProfile.address,
          memoFooter: data.shopProfile.memoFooter,
        });
      }
    }

    // 4. Upsert Base Rates
    if (data.baseRate) {
      const existingRate = await db.select().from(baseRates).where(eq(baseRates.userId, uid));
      if (existingRate.length > 0) {
        await db.update(baseRates)
          .set({
            redRate: data.baseRate.redRate,
            whiteRate: data.baseRate.whiteRate,
            duckRate: data.baseRate.duckRate ?? 1350,
            quailRate: data.baseRate.quailRate ?? 350,
            effectiveDate: data.baseRate.effectiveDate,
            lastUpdated: data.baseRate.lastUpdated,
            note: data.baseRate.note ?? '',
          })
          .where(eq(baseRates.userId, uid));
      } else {
        await db.insert(baseRates).values({
          userId: uid,
          redRate: data.baseRate.redRate,
          whiteRate: data.baseRate.whiteRate,
          duckRate: data.baseRate.duckRate ?? 1350,
          quailRate: data.baseRate.quailRate ?? 350,
          effectiveDate: data.baseRate.effectiveDate,
          lastUpdated: data.baseRate.lastUpdated,
          note: data.baseRate.note ?? '',
        });
      }
    }

    // 5. Upsert Parties
    if (data.parties && data.parties.length > 0) {
      for (const p of data.parties) {
        await db.insert(parties)
          .values({
            id: p.id,
            userId: uid,
            name: p.name,
            phone: p.phone,
            address: p.address || '',
            type: p.type,
            currentDue: Math.round(p.currentDue || 0),
            totalPurchased: Math.round(p.totalPurchased || 0),
            notes: p.notes || '',
            createdAt: p.createdAt,
            updatedAt: p.updatedAt || p.createdAt,
          })
          .onConflictDoUpdate({
            target: parties.id,
            set: {
              name: p.name,
              phone: p.phone,
              address: p.address || '',
              type: p.type,
              currentDue: Math.round(p.currentDue || 0),
              totalPurchased: Math.round(p.totalPurchased || 0),
              notes: p.notes || '',
              updatedAt: p.updatedAt || new Date().toISOString(),
            },
          });
      }
    }

    // 6. Upsert Memos
    if (data.memos && data.memos.length > 0) {
      for (const m of data.memos) {
        await db.insert(memos)
          .values({
            id: m.id,
            userId: uid,
            memoNumber: m.memoNumber,
            partyId: m.partyId,
            partyName: m.partyName,
            partyPhone: m.partyPhone,
            partyType: m.partyType,
            date: m.date,
            formattedDate: m.formattedDate,
            itemsJson: JSON.stringify(m.items || []),
            totalEggs: Math.round(m.totalEggs || 0),
            totalKhacha: Math.round(m.totalKhacha || 0),
            totalBill: Math.round(m.totalBill || 0),
            previousDue: Math.round(m.previousDue || 0),
            totalDemand: Math.round(m.totalDemand || 0),
            cashPaid: Math.round(m.cashPaid || 0),
            remainingDue: Math.round(m.remainingDue || 0),
            khachaLent: Math.round(m.khachaLent || 0),
            khachaReturned: Math.round(m.khachaReturned || 0),
            note: m.note || '',
            createdAt: m.createdAt,
          })
          .onConflictDoUpdate({
            target: memos.id,
            set: {
              partyName: m.partyName,
              partyPhone: m.partyPhone,
              partyType: m.partyType,
              date: m.date,
              formattedDate: m.formattedDate,
              itemsJson: JSON.stringify(m.items || []),
              totalEggs: Math.round(m.totalEggs || 0),
              totalKhacha: Math.round(m.totalKhacha || 0),
              totalBill: Math.round(m.totalBill || 0),
              previousDue: Math.round(m.previousDue || 0),
              totalDemand: Math.round(m.totalDemand || 0),
              cashPaid: Math.round(m.cashPaid || 0),
              remainingDue: Math.round(m.remainingDue || 0),
              khachaLent: Math.round(m.khachaLent || 0),
              khachaReturned: Math.round(m.khachaReturned || 0),
              note: m.note || '',
            },
          });
      }
    }

    // 7. Upsert Suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      for (const s of data.suppliers) {
        await db.insert(suppliers)
          .values({
            id: s.id,
            userId: uid,
            name: s.name,
            phone: s.phone,
            farmLocation: s.farmLocation || '',
            address: s.address || '',
            totalPayable: Math.round(s.totalPayable || 0),
            totalPurchased: Math.round(s.totalPurchased || 0),
            totalPaid: Math.round(s.totalPaid || 0),
            notes: s.notes || '',
            createdAt: s.createdAt,
            updatedAt: s.updatedAt || s.createdAt,
          })
          .onConflictDoUpdate({
            target: suppliers.id,
            set: {
              name: s.name,
              phone: s.phone,
              farmLocation: s.farmLocation || '',
              address: s.address || '',
              totalPayable: Math.round(s.totalPayable || 0),
              totalPurchased: Math.round(s.totalPurchased || 0),
              totalPaid: Math.round(s.totalPaid || 0),
              notes: s.notes || '',
              updatedAt: s.updatedAt || new Date().toISOString(),
            },
          });
      }
    }

    // 8. Upsert Chalans
    if (data.supplierChalans && data.supplierChalans.length > 0) {
      for (const c of data.supplierChalans) {
        await db.insert(chalans)
          .values({
            id: c.id,
            userId: uid,
            chalanNumber: c.chalanNumber,
            supplierId: c.supplierId,
            supplierName: c.supplierName,
            supplierPhone: c.supplierPhone || '',
            date: c.date,
            formattedDate: c.formattedDate,
            eggCount: Math.round(c.eggCount || 0),
            khachaCount: Math.round(c.khachaCount || 0),
            ratePerHundred: Math.round(c.ratePerHundred || 0),
            redEggCount: Math.round(c.redEggCount || 0),
            redKhachaCount: Math.round(c.redKhachaCount || 0),
            redRatePerHundred: Math.round(c.redRatePerHundred || 0),
            redRatePerPiece: c.redRatePerPiece || 0,
            redTotalAmount: Math.round(c.redTotalAmount || 0),
            whiteEggCount: Math.round(c.whiteEggCount || 0),
            whiteKhachaCount: Math.round(c.whiteKhachaCount || 0),
            whiteRatePerHundred: Math.round(c.whiteRatePerHundred || 0),
            whiteRatePerPiece: c.whiteRatePerPiece || 0,
            whiteTotalAmount: Math.round(c.whiteTotalAmount || 0),
            totalAmount: Math.round(c.totalAmount || 0),
            previousDue: Math.round(c.previousDue || 0),
            totalDemand: Math.round(c.totalDemand || 0),
            paidAmount: Math.round(c.paidAmount || 0),
            dueAmount: Math.round(c.dueAmount || 0),
            remainingDue: Math.round(c.remainingDue || 0),
            truckNumber: c.truckNumber || '',
            driverName: c.driverName || '',
            transportCost: Math.round(c.transportCost || 0),
            note: c.note || '',
            createdAt: c.createdAt,
          })
          .onConflictDoUpdate({
            target: chalans.id,
            set: {
              supplierName: c.supplierName,
              supplierPhone: c.supplierPhone || '',
              date: c.date,
              formattedDate: c.formattedDate,
              eggCount: Math.round(c.eggCount || 0),
              khachaCount: Math.round(c.khachaCount || 0),
              ratePerHundred: Math.round(c.ratePerHundred || 0),
              redEggCount: Math.round(c.redEggCount || 0),
              redKhachaCount: Math.round(c.redKhachaCount || 0),
              redRatePerHundred: Math.round(c.redRatePerHundred || 0),
              redRatePerPiece: c.redRatePerPiece || 0,
              redTotalAmount: Math.round(c.redTotalAmount || 0),
              whiteEggCount: Math.round(c.whiteEggCount || 0),
              whiteKhachaCount: Math.round(c.whiteKhachaCount || 0),
              whiteRatePerHundred: Math.round(c.whiteRatePerHundred || 0),
              whiteRatePerPiece: c.whiteRatePerPiece || 0,
              whiteTotalAmount: Math.round(c.whiteTotalAmount || 0),
              totalAmount: Math.round(c.totalAmount || 0),
              previousDue: Math.round(c.previousDue || 0),
              totalDemand: Math.round(c.totalDemand || 0),
              paidAmount: Math.round(c.paidAmount || 0),
              dueAmount: Math.round(c.dueAmount || 0),
              remainingDue: Math.round(c.remainingDue || 0),
              truckNumber: c.truckNumber || '',
              driverName: c.driverName || '',
              transportCost: Math.round(c.transportCost || 0),
              note: c.note || '',
            },
          });
      }
    }

    // 9. Upsert Expenses
    if (data.expenses && data.expenses.length > 0) {
      for (const e of data.expenses) {
        await db.insert(expenses)
          .values({
            id: e.id,
            userId: uid,
            title: e.title,
            amount: Math.round(e.amount || 0),
            category: e.category,
            date: e.date,
            formattedDate: e.formattedDate || '',
            paymentMethod: e.paymentMethod || 'নগদ',
            note: e.note || '',
            createdAt: e.createdAt,
          })
          .onConflictDoUpdate({
            target: expenses.id,
            set: {
              title: e.title,
              amount: Math.round(e.amount || 0),
              category: e.category,
              date: e.date,
              formattedDate: e.formattedDate || '',
              paymentMethod: e.paymentMethod || 'নগদ',
              note: e.note || '',
            },
          });
      }
    }

    return { success: true, totalRecords };
  } catch (error) {
    console.error('Error saving data to Cloud SQL:', error);
    throw new Error('Database save failed', { cause: error });
  }
}

/**
 * Fetch complete user dataset from Cloud SQL / Supabase PostgreSQL database
 */
export async function getAppCloudData(uid: string): Promise<UserCloudData | null> {
  try {
    // 1. Fetch latest backup snapshot if available
    const [latestBackup] = await db.select()
      .from(cloudBackups)
      .where(eq(cloudBackups.userId, uid))
      .orderBy(cloudBackups.id)
      .limit(1);

    if (latestBackup && latestBackup.backupDataJson) {
      try {
        const parsed = JSON.parse(latestBackup.backupDataJson);
        return parsed;
      } catch (e) {
        console.warn('Failed to parse backup snapshot JSON:', e);
      }
    }

    // 2. Alternatively reconstruct from relational tables
    const userParties = await db.select().from(parties).where(eq(parties.userId, uid));
    const userMemos = await db.select().from(memos).where(eq(memos.userId, uid));
    const userSuppliers = await db.select().from(suppliers).where(eq(suppliers.userId, uid));
    const userChalans = await db.select().from(chalans).where(eq(chalans.userId, uid));
    const userExpenses = await db.select().from(expenses).where(eq(expenses.userId, uid));
    const [userProfile] = await db.select().from(shopProfiles).where(eq(shopProfiles.userId, uid));
    const [userRates] = await db.select().from(baseRates).where(eq(baseRates.userId, uid));

    const formattedMemos = userMemos.map(m => {
      let items = [];
      try {
        items = JSON.parse(m.itemsJson);
      } catch {
        items = [];
      }
      return {
        id: m.id,
        memoNumber: m.memoNumber,
        partyId: m.partyId,
        partyName: m.partyName,
        partyPhone: m.partyPhone,
        partyType: m.partyType as any,
        date: m.date,
        formattedDate: m.formattedDate || m.date,
        items,
        totalEggs: m.totalEggs,
        totalKhacha: m.totalKhacha || 0,
        totalBill: m.totalBill,
        previousDue: m.previousDue,
        totalDemand: m.totalDemand,
        cashPaid: m.cashPaid,
        remainingDue: m.remainingDue,
        khachaLent: m.khachaLent || 0,
        khachaReturned: m.khachaReturned || 0,
        note: m.note || '',
        createdAt: m.createdAt || new Date().toISOString(),
      };
    });

    const formattedChalans = userChalans.map(c => ({
      id: c.id,
      chalanNumber: c.chalanNumber,
      supplierId: c.supplierId,
      supplierName: c.supplierName,
      supplierPhone: c.supplierPhone || '',
      date: c.date,
      formattedDate: c.formattedDate || c.date,
      eggCount: c.eggCount,
      khachaCount: c.khachaCount || 0,
      ratePerHundred: c.ratePerHundred || 0,
      redEggCount: c.redEggCount || 0,
      redKhachaCount: c.redKhachaCount || 0,
      redRatePerHundred: c.redRatePerHundred || 0,
      redRatePerPiece: c.redRatePerPiece || 0,
      redTotalAmount: c.redTotalAmount || 0,
      whiteEggCount: c.whiteEggCount || 0,
      whiteKhachaCount: c.whiteKhachaCount || 0,
      whiteRatePerHundred: c.whiteRatePerHundred || 0,
      whiteRatePerPiece: c.whiteRatePerPiece || 0,
      whiteTotalAmount: c.whiteTotalAmount || 0,
      totalAmount: c.totalAmount,
      previousDue: c.previousDue || 0,
      totalDemand: c.totalDemand || c.totalAmount,
      paidAmount: c.paidAmount,
      dueAmount: c.dueAmount,
      remainingDue: c.remainingDue || 0,
      truckNumber: c.truckNumber || '',
      driverName: c.driverName || '',
      transportCost: c.transportCost || 0,
      note: c.note || '',
      createdAt: c.createdAt || new Date().toISOString(),
    }));

    return {
      shopProfile: userProfile ? {
        name: userProfile.name,
        tagline: userProfile.tagline || '',
        proprietor: userProfile.proprietor || '',
        mobile: userProfile.mobile || '',
        address: userProfile.address || '',
        memoFooter: userProfile.memoFooter || '',
      } : undefined,
      baseRate: userRates ? {
        redRate: userRates.redRate,
        whiteRate: userRates.whiteRate,
        duckRate: userRates.duckRate || 1350,
        quailRate: userRates.quailRate || 350,
        lastUpdated: userRates.lastUpdated || '',
        effectiveDate: userRates.effectiveDate || '',
        note: userRates.note || '',
      } : undefined,
      parties: userParties.map(p => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        address: p.address || '',
        type: p.type as any,
        currentDue: p.currentDue,
        totalPurchased: p.totalPurchased || 0,
        notes: p.notes || '',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || undefined,
      })),
      memos: formattedMemos,
      suppliers: userSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        farmLocation: s.farmLocation || '',
        address: s.address || '',
        totalPayable: s.totalPayable,
        totalPurchased: s.totalPurchased || 0,
        totalPaid: s.totalPaid || 0,
        notes: s.notes || '',
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || undefined,
      })),
      supplierChalans: formattedChalans,
      expenses: userExpenses.map(e => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        category: e.category as any,
        date: e.date,
        formattedDate: e.formattedDate || e.date,
        paymentMethod: (e.paymentMethod as any) || 'নগদ',
        note: e.note || '',
        createdAt: e.createdAt || new Date().toISOString(),
      })),
      hasData: true,
      totalMemos: formattedMemos.length,
      totalParties: userParties.length,
      totalSuppliers: userSuppliers.length,
      totalExpenses: userExpenses.length,
      lastBackupDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching data from Cloud SQL:', error);
    throw new Error('Database fetch failed', { cause: error });
  }
}

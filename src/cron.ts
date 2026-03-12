import cron from 'node-cron';
import { db } from './firebase';

// Every hour, process factories and productions
cron.schedule('0 * * * *', async () => {
  try {
    const clansRef = db.ref('clans');
    const snapshot = await clansRef.once('value');
    const clans = snapshot.val();

    if (!clans) return;

    for (const [clanId, clan] of Object.entries(clans)) {
      let treasuryAdd = 0;
      let weaponsAdd = 0;
      
      const factories = (clan as any).factories || {};
      for (const [factoryId, factory] of Object.entries(factories)) {
        const f = factory as any;
        if (f.type === 'financial') {
          treasuryAdd += (f.level === 3 ? 40 : f.level === 2 ? 20 : 10);
        } else if (f.type === 'weapon') {
          weaponsAdd += (f.level === 3 ? 40 : f.level === 2 ? 20 : 10);
        }
      }

      const updates: any = {};
      if (treasuryAdd > 0) {
        updates[`clans/${clanId}/treasury`] = ((clan as any).treasury || 0) + treasuryAdd;
      }
      if (weaponsAdd > 0) {
        updates[`clans/${clanId}/weapons`] = ((clan as any).weapons || 0) + weaponsAdd;
      }

      const productions = (clan as any).productions || {};
      for (const [prodId, prod] of Object.entries(productions)) {
        const p = prod as any;
        const amount = p.level === 2 ? 10 : 5;
        updates[`clans/${clanId}/productions/${prodId}/amount`] = (p.amount || 0) + amount;
      }

      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
      }
    }
  } catch (e) {
    console.error('Cron error:', e);
  }
});

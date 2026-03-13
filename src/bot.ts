import TelegramBot from 'node-telegram-bot-api';
import { db } from './firebase';

const token = '8555470613:AAEg-CgGbYtm1yuxnzEwY3_nA4jmKGJHJJo';
const bot = new TelegramBot(token, { polling: true });

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

const ADMIN_USERNAME = 'Trim_peek';

const pendingClanCreations = new Map<number, { name: string, tag: string }>();

// Helper functions
const getUser = async (userId: number) => {
  const snapshot = await db.ref(`users/${userId}`).once('value');
  return snapshot.val();
};

const getClan = async (clanId: string) => {
  const snapshot = await db.ref(`clans/${clanId}`).once('value');
  return snapshot.val();
};

const updateClan = async (clanId: string, data: any) => {
  await db.ref(`clans/${clanId}`).update(data);
};

const updateUser = async (userId: number, data: any) => {
  await db.ref(`users/${userId}`).update(data);
};

// Middleware to check bot status
bot.on('message', async (msg) => {
  if (!msg.text || !msg.text.startsWith('/')) return;

  try {
    const settingsSnap = await Promise.race([
      db.ref('settings').once('value'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000))
    ]) as any;
    const settings = settingsSnap.val() || {};

    const isCmd = msg.text.startsWith('/');
    const isAdmin = msg.from?.username === ADMIN_USERNAME;

    if (isCmd && !isAdmin) {
      if (settings.bot_disabled) {
        bot.sendMessage(msg.chat.id, '🛠 Бот на тех.перерыве');
        return;
      }
      if (settings.test_mode) {
        bot.sendMessage(msg.chat.id, '🔧 Бот на тестовом осмотре');
        return;
      }
    }

    // Handle commands
    const args = msg.text.split(' ');
    let cmd = args[0].toLowerCase();
    if (cmd.includes('@')) {
      cmd = cmd.split('@')[0];
    }

    if (cmd === '/создать' && args[1] === 'клан') {
      await createClan(msg, args.slice(2));
    } else if (cmd === '/вступить') {
      await joinClan(msg, args.slice(1));
    } else if (cmd === '/выйти') {
      await leaveClan(msg);
    } else if (cmd === '/мой' && args[1] === 'клан') {
      await myClan(msg);
    } else if (cmd === '/info') {
      await infoClan(msg, args.slice(1));
    } else if (cmd === '/список' && args[1] === 'кланов') {
      await listClans(msg);
    } else if (cmd === '/работа' || cmd === '/работа2' || cmd === '/завод') {
      await work(msg, cmd);
    } else if (cmd === '/строй' && args[1] === 'завод') {
      await buildFactory(msg, args[2]);
    } else if (cmd === '/мои' && args[1] === 'заводы') {
      await myFactories(msg);
    } else if (cmd === '/апгрейд' && args[1] === 'завод') {
      await upgradeFactory(msg);
    } else if (cmd === '/объявить' && args[1] === 'войну') {
      await declareWar(msg, args.slice(2));
    } else if (cmd === '/мобилизация') {
      await mobilization(msg);
    } else if (cmd === '/атака') {
      await attack(msg, args[1]);
    } else if (cmd === '/белый' && args[1] === 'мир') {
      await whitePeace(msg, args.slice(2));
    } else if (cmd === '/капитуляция') {
      await capitulate(msg, args.slice(1));
    } else if (cmd === '/создать' && args[1] === 'производство') {
      await createProduction(msg, args.slice(2));
    } else if (cmd === '/прокачать' && args[1] === 'производство') {
      await upgradeProduction(msg);
    } else if (cmd === '/производство') {
      await listProductions(msg);
    } else if (cmd === '/продать') {
      await sellProduction(msg);
    } else if (cmd === '/профиль') {
      await profile(msg);
    } else if (cmd === '/уровень') {
      await level(msg);
    } else if (cmd === '/достижения') {
      bot.sendMessage(msg.chat.id, 'Достижения в разработке.');
    } else if (cmd === '/инфо' && args[1] === 'экономика') {
      await infoEconomy(msg);
    } else if (cmd === '/назначить') {
      await assignRole(msg, args);
    } else if (cmd === '/снять') {
      await removeRole(msg, args);
    } else if (cmd === '/правило') {
      await rules(msg);
    } else if (cmd === '/топ') {
      await topClans(msg);
    } else if (cmd === '/переименовать' && args[1] === 'клан') {
      await renameClan(msg, args.slice(2));
    } else if (cmd === '/переименовать' && args[1] === 'производство') {
      await renameProduction(msg, args.slice(2));
    } else if (cmd === '/на-') {
      await notifyClan(msg, args);
    } else if (cmd === '/разработка') {
      await rocketDev(msg);
    } else if (cmd === '/пуск') {
      await rocketLaunch(msg, args.slice(1));
    } else if (cmd === '/быстрые_действия') {
      bot.sendMessage(msg.chat.id, 'Быстрые действия в разработке.');
    } else if (cmd === '/календарь') {
      bot.sendMessage(msg.chat.id, 'Календарь в разработке.');
    } else if (cmd === '/omg2105' && isAdmin) {
      await adminPanel(msg);
    } else if (cmd === '/удалить' && args[1] === 'клан') {
      await deleteClan(msg);
    } else if (cmd === '/перемирие') {
      await truce(msg, args.slice(1));
    } else if (cmd === '/аннексия') {
      await annex(msg, args.slice(1));
    } else if (cmd === '/ультиматум') {
      await ultimatum(msg, args.slice(1));
    } else if (cmd === '/предложить' && args[1] === 'альянс') {
      await proposeAlliance(msg, args.slice(2));
    } else if (cmd === '/разорвать' && args[1] === 'альянс') {
      await breakAlliance(msg, args.slice(2));
    } else if (cmd === '/вкл2105' && isAdmin) {
      await db.ref('settings/bot_disabled').set(false);
      bot.sendMessage(msg.chat.id, 'Бот включен.');
    } else if (cmd === '/выкл2105' && isAdmin) {
      await db.ref('settings/bot_disabled').set(true);
      bot.sendMessage(msg.chat.id, 'Бот выключен.');
    }
    // Add other commands as needed
  } catch (e) {
    console.error(e);
    bot.sendMessage(msg.chat.id, 'Произошла ошибка при выполнении команды.');
  }
});

async function createClan(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (user && user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы уже в клане. Покиньте его, чтобы создать новый.');
    return;
  }

  if (args.length < 2) {
    bot.sendMessage(msg.chat.id, 'Использование: /создать клан [название] [тег]');
    return;
  }

  const tag = args.pop()!;
  const name = args.join(' ');

  const nameSnap = await db.ref('clans').orderByChild('name').equalTo(name).once('value');
  if (nameSnap.exists()) {
    bot.sendMessage(msg.chat.id, 'Клан с таким названием уже существует.');
    return;
  }

  const tagSnap = await db.ref('clans').orderByChild('tag').equalTo(tag).once('value');
  if (tagSnap.exists()) {
    bot.sendMessage(msg.chat.id, 'Клан с таким тегом уже существует.');
    return;
  }

  pendingClanCreations.set(userId, { name, tag });

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Да, создать', callback_data: 'confirm_create_clan' },
          { text: '❌ Отмена', callback_data: 'cancel_create_clan' }
        ]
      ]
    }
  };

  bot.sendMessage(msg.chat.id, `Будет создан клан ${name} [${tag}]. Вы уверены?`, opts);
}

async function joinClan(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (user && user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы уже состоите в клане. Сначала покиньте его.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название или тег клана.');
    return;
  }

  let snapshot = await db.ref('clans').orderByChild('name').equalTo(targetName).once('value');
  let targets = snapshot.val();

  if (!targets) {
    snapshot = await db.ref('clans').orderByChild('tag').equalTo(targetName).once('value');
    targets = snapshot.val();
  }

  if (!targets) {
    const clanSnap = await db.ref(`clans/${targetName}`).once('value');
    if (clanSnap.exists()) {
      targets = { [targetName]: clanSnap.val() };
    }
  }

  if (!targets) {
    bot.sendMessage(msg.chat.id, 'Клан не найден.');
    return;
  }

  const clanId = Object.keys(targets)[0];
  const clan = targets[clanId];

  const memberCount = Object.keys(clan.members || {}).length;
  if (memberCount >= (clan.populationLimit || 15)) {
    bot.sendMessage(msg.chat.id, 'В клане нет мест.');
    return;
  }

  await db.ref(`clans/${clanId}/members/${userId}`).set({ role: 'member' });
  await updateUser(userId, { clanId, role: 'member', contribution: 0 });

  bot.sendMessage(msg.chat.id, `Вы успешно вступили в клан ${clan.name}!`);
}

async function leaveClan(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  if (clan.leaderId === userId) {
    bot.sendMessage(msg.chat.id, 'Вы лидер. Передайте лидерство или распустите клан.');
    return;
  }

  await db.ref(`clans/${user.clanId}/members/${userId}`).remove();
  await db.ref(`users/${userId}/clanId`).remove();

  bot.sendMessage(msg.chat.id, 'Вы покинули клан.');
}

async function myClan(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const memberCount = Object.keys(clan.members || {}).length;

  const text = `🏰 Клан: ${clan.name} [${clan.tag}]
👑 Лидер: ${clan.leaderId === userId ? 'Вы' : 'Другой игрок'}
👥 Участники: ${memberCount}/${clan.populationLimit || 15}
⭐ Уровень: ${clan.level || 1}
❤️ Здоровье столицы: ${clan.capitalHp}
💰 Казна: ${clan.treasury || 0} монет
🔫 Армия: ${clan.army || 0} солдат, ${clan.weapons || 0} автоматов`;

  bot.sendMessage(msg.chat.id, text);
}

async function infoClan(msg: TelegramBot.Message, args: string[]) {
  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название или тег клана.');
    return;
  }

  let snapshot = await db.ref('clans').orderByChild('name').equalTo(targetName).once('value');
  let targets = snapshot.val();

  if (!targets) {
    snapshot = await db.ref('clans').orderByChild('tag').equalTo(targetName).once('value');
    targets = snapshot.val();
  }

  if (!targets) {
    const clanSnap = await db.ref(`clans/${targetName}`).once('value');
    if (clanSnap.exists()) {
      targets = { [targetName]: clanSnap.val() };
    }
  }

  if (!targets) {
    bot.sendMessage(msg.chat.id, 'Клан не найден.');
    return;
  }

  const clanId = Object.keys(targets)[0];
  const clan = targets[clanId];
  
  const leaderUser = await bot.getChat(clan.leaderId).catch(() => null);
  const leaderName = leaderUser ? (leaderUser.username ? `@${leaderUser.username}` : leaderUser.first_name) : 'Неизвестно';

  const text = `
🏰 Клан: ${clan.name} [${clan.tag}]
👑 Лидер: ${leaderName}
👥 Участников: ${Object.keys(clan.members || {}).length} / ${clan.populationLimit || 15}
⭐ Уровень: ${clan.level || 1}
🛡️ HP Столицы: ${clan.capitalHp || 10000}
🪖 Армия: ${clan.army || 0} бойцов
  `;

  bot.sendMessage(msg.chat.id, text);
}

async function listClans(msg: TelegramBot.Message) {
  const snapshot = await db.ref('clans').once('value');
  const clans = snapshot.val() || {};

  let text = 'Список кланов:\n\n';
  for (const [id, clan] of Object.entries(clans)) {
    const c = clan as any;
    text += `🏰 ${c.name} [${c.tag}] - Участников: ${Object.keys(c.members || {}).length}\n`;
  }

  bot.sendMessage(msg.chat.id, text);
}

async function work(msg: TelegramBot.Message, type: string) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане. Найдите или создайте клан, чтобы работать.');
    return;
  }

  const now = Date.now();
  const lastWork = user[`last_${type.substring(1)}`] || 0;
  
  let cdHours = 6;
  let min = 100, max = 500;

  if (type === '/работа2') {
    cdHours = 12;
    min = 200; max = 800;
  } else if (type === '/завод') {
    cdHours = 48;
    min = 1000; max = 2000;
  }

  if (now - lastWork < cdHours * 3600000) {
    const remaining = Math.ceil((cdHours * 3600000 - (now - lastWork)) / 60000);
    bot.sendMessage(msg.chat.id, `Команда будет доступна через ${remaining} минут.`);
    return;
  }

  const earned = Math.floor(Math.random() * (max - min + 1)) + min;
  
  const clan = await getClan(user.clanId);
  await updateClan(user.clanId, { treasury: (clan.treasury || 0) + earned });
  
  const updates: any = {};
  updates[`last_${type.substring(1)}`] = now;
  updates.contribution = (user.contribution || 0) + earned;
  await updateUser(userId, updates);

  bot.sendMessage(msg.chat.id, `Вы пошли работать на благо клана. Зарплата: ${earned} монет.\n➕ Клан получил ${earned} монет. Теперь в казне: ${(clan.treasury || 0) + earned} монет. Ваш личный вклад: ${updates.contribution} монет.`);
}

async function buildFactory(msg: TelegramBot.Message, type: string) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  if (type !== 'финансовый' && type !== 'оружейный') {
    bot.sendMessage(msg.chat.id, 'Укажите тип завода: финансовый или оружейный.');
    return;
  }

  const cost = type === 'финансовый' ? 1000 : 1250;
  const clan = await getClan(user.clanId);

  if ((clan.treasury || 0) < cost) {
    bot.sendMessage(msg.chat.id, `В казне недостаточно средств. Нужно ${cost} монет, а у вас ${clan.treasury || 0}.`);
    return;
  }

  const factoryType = type === 'финансовый' ? 'financial' : 'weapon';
  const factoryId = db.ref(`clans/${user.clanId}/factories`).push().key!;
  
  await db.ref(`clans/${user.clanId}/factories/${factoryId}`).set({
    type: factoryType,
    builder: userId,
    level: 1,
    createdAt: Date.now()
  });

  await updateClan(user.clanId, { treasury: clan.treasury - cost });

  bot.sendMessage(msg.chat.id, `Завод (${type}) успешно построен!`);
}

async function myFactories(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const factories = clan.factories || {};

  let text = '🏭 Заводы клана:\n\n';
  for (const [id, f] of Object.entries(factories)) {
    const factory = f as any;
    const typeStr = factory.type === 'financial' ? '🏦 Финансовый' : '🔫 Оружейный';
    const prodStr = factory.type === 'financial' ? 'монет/ч' : 'автоматов/ч';
    const prodAmt = factory.level === 3 ? 40 : factory.level === 2 ? 20 : 10;
    
    text += `${typeStr} (ур.${factory.level}) — ${prodAmt} ${prodStr}\n`;
  }

  bot.sendMessage(msg.chat.id, text);
}

async function upgradeFactory(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const factories = clan.factories || {};

  if (Object.keys(factories).length === 0) {
    bot.sendMessage(msg.chat.id, 'У клана нет заводов.');
    return;
  }

  const keyboard = Object.entries(factories).map(([id, f]: [string, any]) => {
    return [{ text: `${f.type === 'financial' ? 'Финансовый' : 'Оружейный'} (Ур.${f.level || 1}) - 1000 монет`, callback_data: `upg_fact_${id}` }];
  });

  bot.sendMessage(msg.chat.id, 'Выберите завод для прокачки:', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function declareWar(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер клана может объявлять войну.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана-цели.');
    return;
  }

  const snapshot = await db.ref('clans').orderByChild('name').equalTo(targetName).once('value');
  const targets = snapshot.val();
  if (!targets) {
    bot.sendMessage(msg.chat.id, 'Клан не найден.');
    return;
  }

  const targetId = Object.keys(targets)[0];
  if (targetId === user.clanId) {
    bot.sendMessage(msg.chat.id, 'Нельзя объявить войну самому себе.');
    return;
  }

  await db.ref(`clans/${user.clanId}/wars/${targetId}`).set({ active: true, declaredAt: Date.now() });
  await db.ref(`clans/${targetId}/wars/${user.clanId}`).set({ active: true, declaredAt: Date.now() });

  bot.sendMessage(msg.chat.id, `Вы объявили войну клану ${targetName}!`);
}

async function mobilization(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || (user.role !== 'leader' && user.role !== 'officer')) {
    bot.sendMessage(msg.chat.id, 'Только лидеры и офицеры могут проводить мобилизацию.');
    return;
  }

  const clan = await getClan(user.clanId);
  const cost = 500;

  if ((clan.treasury || 0) < cost) {
    bot.sendMessage(msg.chat.id, `Недостаточно средств в казне. Нужно ${cost} монет.`);
    return;
  }

  const now = Date.now();
  const lastMob = clan.lastMobilization || 0;
  if (now - lastMob < 5 * 3600000) {
    const remaining = Math.ceil((5 * 3600000 - (now - lastMob)) / 60000);
    bot.sendMessage(msg.chat.id, `Мобилизация будет доступна через ${remaining} минут.`);
    return;
  }

  const soldiers = Math.floor(Math.random() * (2500 - 1000 + 1)) + 1000;
  
  await updateClan(user.clanId, {
    treasury: clan.treasury - cost,
    army: (clan.army || 0) + soldiers,
    lastMobilization: now
  });

  bot.sendMessage(msg.chat.id, `Вы провели мобилизацию на ${cost} монет и призвали ${soldiers} солдат. Теперь в армии клана ${(clan.army || 0) + soldiers} бойцов.`);
}

async function attack(msg: TelegramBot.Message, amountStr: string) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || (user.role !== 'leader' && user.role !== 'officer')) {
    bot.sendMessage(msg.chat.id, 'Только лидеры и офицеры могут атаковать.');
    return;
  }

  const clan = await getClan(user.clanId);
  const wars = clan.wars || {};
  const activeWars = Object.keys(wars).filter(k => wars[k].active);

  if (activeWars.length === 0) {
    bot.sendMessage(msg.chat.id, 'Ваш клан ни с кем не воюет.');
    return;
  }

  const targetId = activeWars[0]; // Simplified: attack the first active war target
  const targetClan = await getClan(targetId);

  let amount = parseInt(amountStr);
  if (isNaN(amount) || amount <= 0) {
    bot.sendMessage(msg.chat.id, 'Укажите корректное количество солдат для атаки.');
    return;
  }

  if (amount > (clan.army || 0)) {
    bot.sendMessage(msg.chat.id, `У вас нет столько солдат. В армии: ${clan.army || 0}`);
    return;
  }

  bot.sendMessage(msg.chat.id, '⚔️ Атака началась, ожидайте результата...');

  setTimeout(async () => {
    // Refresh clan data
    const currentClan = await getClan(user.clanId);
    const currentTarget = await getClan(targetId);

    const attackerWeapons = currentClan.weapons || 0;
    const attackerSoldiers = amount;
    const effectiveAttackerStrength = attackerSoldiers * (attackerWeapons >= attackerSoldiers ? 1 : (attackerWeapons / attackerSoldiers || 0.2));

    const defenderSoldiers = currentTarget.defense || 0;
    const defenderWeapons = currentTarget.weapons || 0;
    const effectiveDefenderStrength = defenderSoldiers * (defenderWeapons >= defenderSoldiers ? 1 : (defenderWeapons / defenderSoldiers || 0.2));

    const attackerLosses = Math.floor(attackerSoldiers * 0.1);
    const defenderLosses = Math.floor(defenderSoldiers * 0.1);
    const damageToCapital = Math.floor(effectiveAttackerStrength * (1 / (1 + (defenderSoldiers / 100))));

    await updateClan(user.clanId, {
      army: Math.max(0, (currentClan.army || 0) - attackerLosses)
    });

    await updateClan(targetId, {
      defense: Math.max(0, (currentTarget.defense || 0) - defenderLosses),
      capitalHp: Math.max(0, (currentTarget.capitalHp || 10000) - damageToCapital)
    });

    bot.sendMessage(msg.chat.id, `Результат атаки на ${currentTarget.name}:
Ваши потери: ${attackerLosses} бойцов
Потери врага: ${defenderLosses} бойцов (в обороне)
Урон по столице врага: ${damageToCapital} HP`);

    if (currentTarget.capitalHp - damageToCapital <= 0) {
      bot.sendMessage(msg.chat.id, `Столица клана ${currentTarget.name} уничтожена! Они могут капитулировать.`);
    }
  }, 5000); // 5 seconds delay for attack
}

async function whitePeace(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер клана может предлагать белый мир.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана-цели.');
    return;
  }

  const snapshot = await db.ref('clans').orderByChild('name').equalTo(targetName).once('value');
  const targets = snapshot.val();
  if (!targets) {
    bot.sendMessage(msg.chat.id, 'Клан не найден.');
    return;
  }

  const targetId = Object.keys(targets)[0];
  const clan = await getClan(user.clanId);

  if (!clan.wars || !clan.wars[targetId] || !clan.wars[targetId].active) {
    bot.sendMessage(msg.chat.id, 'Вы не воюете с этим кланом.');
    return;
  }

  // Simplified: instantly accept white peace for now
  await db.ref(`clans/${user.clanId}/wars/${targetId}`).remove();
  await db.ref(`clans/${targetId}/wars/${user.clanId}`).remove();

  bot.sendMessage(msg.chat.id, `Вы заключили белый мир с кланом ${targetName}.`);
}

async function capitulate(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер клана может капитулировать.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана, которому вы капитулируете.');
    return;
  }

  const snapshot = await db.ref('clans').orderByChild('name').equalTo(targetName).once('value');
  const targets = snapshot.val();
  if (!targets) {
    bot.sendMessage(msg.chat.id, 'Клан не найден.');
    return;
  }

  const targetId = Object.keys(targets)[0];
  const clan = await getClan(user.clanId);

  if (!clan.wars || !clan.wars[targetId] || !clan.wars[targetId].active) {
    bot.sendMessage(msg.chat.id, 'Вы не воюете с этим кланом.');
    return;
  }

  if ((clan.capitalHp || 10000) > 0) {
    bot.sendMessage(msg.chat.id, 'Ваша столица еще не уничтожена. Вы не можете капитулировать.');
    return;
  }

  const targetClan = await getClan(targetId);
  const tribute = Math.floor((clan.treasury || 0) * 0.5);

  await updateClan(user.clanId, { treasury: (clan.treasury || 0) - tribute, capitalHp: 10000 });
  await updateClan(targetId, { treasury: (targetClan.treasury || 0) + tribute });

  await db.ref(`clans/${user.clanId}/wars/${targetId}`).remove();
  await db.ref(`clans/${targetId}/wars/${user.clanId}`).remove();

  bot.sendMessage(msg.chat.id, `Вы капитулировали перед кланом ${targetName}. Выплачена контрибуция: ${tribute} монет. Война окончена, столица восстановлена.`);
}

async function createProduction(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const name = args.join(' ');
  if (!name) {
    bot.sendMessage(msg.chat.id, 'Укажите название производства.');
    return;
  }

  const clan = await getClan(user.clanId);
  const cost = 1000;

  if ((clan.treasury || 0) < cost) {
    bot.sendMessage(msg.chat.id, `В казне недостаточно средств. Нужно ${cost} монет.`);
    return;
  }

  const prodId = db.ref(`clans/${user.clanId}/productions`).push().key!;
  
  await db.ref(`clans/${user.clanId}/productions/${prodId}`).set({
    name,
    level: 1,
    amount: 0,
    creator: userId
  });

  await updateClan(user.clanId, { treasury: clan.treasury - cost });
  await updateUser(userId, { contribution: (user.contribution || 0) + 1 });

  bot.sendMessage(msg.chat.id, `✅ Производство ${name} создано! Оно будет приносить 5 ед./час. Следующая прокачка стоит 1000 монет и увеличит до 10 ед./час.`);
}

async function upgradeProduction(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const productions = clan.productions || {};

  if (Object.keys(productions).length === 0) {
    bot.sendMessage(msg.chat.id, 'У клана нет производств.');
    return;
  }

  const keyboard = Object.entries(productions).map(([id, p]: [string, any]) => {
    return [{ text: `${p.name} (Ур.${p.level}) - ${p.level === 1 ? 5 : 10} ед/ч`, callback_data: `upg_prod_${id}` }];
  });

  bot.sendMessage(msg.chat.id, 'Выберите производство для прокачки:', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function listProductions(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const productions = clan.productions || {};

  if (Object.keys(productions).length === 0) {
    bot.sendMessage(msg.chat.id, 'У клана нет производств.');
    return;
  }

  let text = '📦 Производства клана:\n\n';
  const keyboard = [];

  for (const [id, p] of Object.entries(productions)) {
    const prod = p as any;
    text += `🏭 ${prod.name} (Ур.${prod.level})\nНа складе: ${prod.amount || 0} ед.\nПроизводительность: ${prod.level === 1 ? 5 : 10} ед/ч\n\n`;
    keyboard.push([{ text: `📦 Продать ${prod.name}`, callback_data: `sell_prod_${id}` }]);
  }

  bot.sendMessage(msg.chat.id, text, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function sellProduction(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const productions = clan.productions || {};

  if (Object.keys(productions).length === 0) {
    bot.sendMessage(msg.chat.id, 'У клана нет производств.');
    return;
  }

  const keyboard = Object.entries(productions).map(([id, p]: [string, any]) => {
    return [{ text: `Продать ${p.name} (${p.amount || 0} ед.)`, callback_data: `sell_prod_${id}` }];
  });

  bot.sendMessage(msg.chat.id, 'Выберите производство для продажи:', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function profile(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user) {
    bot.sendMessage(msg.chat.id, 'Профиль не найден.');
    return;
  }

  let clanText = 'Нет клана';
  if (user.clanId) {
    const clan = await getClan(user.clanId);
    clanText = `${clan.name} [${clan.tag}] (Роль: ${user.role})`;
  }

  const text = `
👤 Профиль: ${msg.from!.first_name}
🏰 Клан: ${clanText}
⭐ Вклад в клан: ${user.contribution || 0}
  `;

  bot.sendMessage(msg.chat.id, text);
}

async function level(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const currentLevel = clan.level || 1;
  const currentExp = clan.experience || 0;
  const expNeeded = currentLevel * 1000;

  if (currentExp >= expNeeded) {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Повысить уровень', callback_data: 'upgrade_clan_level' }]
        ]
      }
    };
    bot.sendMessage(msg.chat.id, `⭐ Уровень клана: ${currentLevel}\nОпыт: ${currentExp}/${expNeeded}\nДоступно повышение уровня!`, opts);
  } else {
    bot.sendMessage(msg.chat.id, `⭐ Уровень клана: ${currentLevel}\nОпыт: ${currentExp}/${expNeeded}\nНедостаточно опыта для повышения уровня.`);
  }
}

async function infoEconomy(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId) {
    bot.sendMessage(msg.chat.id, 'Вы не состоите в клане.');
    return;
  }

  const clan = await getClan(user.clanId);
  const factories = clan.factories || {};
  const productions = clan.productions || {};

  let finCount = 0;
  let wpCount = 0;
  let finIncome = 0;
  let wpIncome = 0;
  for (const f of Object.values(factories) as any[]) {
    if (f.type === 'financial') {
      finCount++;
      finIncome += (f.level === 3 ? 40 : f.level === 2 ? 20 : 10);
    }
    if (f.type === 'weapon') {
      wpCount++;
      wpIncome += (f.level === 3 ? 40 : f.level === 2 ? 20 : 10);
    }
  }

  let prodIncome = 0;
  for (const p of Object.values(productions) as any[]) {
    prodIncome += p.level === 1 ? 5 : 10;
  }

  const text = `
📊 Экономика клана ${clan.name}:

💰 Казна: ${clan.treasury || 0} монет
🏭 Финансовых заводов: ${finCount} (+${finIncome} монет/час)
🏭 Оружейных заводов: ${wpCount} (+${wpIncome} оружия/час)

📦 Производств: ${Object.keys(productions).length}
📈 Общий прирост продукции: +${prodIncome} ед/час
  `;

  bot.sendMessage(msg.chat.id, text);
}

async function assignRole(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может назначать роли.');
    return;
  }

  // Expecting reply to a message or username
  if (!msg.reply_to_message) {
    bot.sendMessage(msg.chat.id, 'Ответьте на сообщение пользователя, чтобы назначить ему роль.');
    return;
  }

  const targetUserId = msg.reply_to_message.from!.id;
  const targetUser = await getUser(targetUserId);

  if (!targetUser || targetUser.clanId !== user.clanId) {
    bot.sendMessage(msg.chat.id, 'Пользователь не состоит в вашем клане.');
    return;
  }

  const role = args[1] === 'офицер' ? 'officer' : 'member';
  await updateUser(targetUserId, { role });

  bot.sendMessage(msg.chat.id, `Пользователь назначен на роль: ${role === 'officer' ? 'Офицер' : 'Участник'}`);
}

async function removeRole(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может снимать роли.');
    return;
  }

  if (!msg.reply_to_message) {
    bot.sendMessage(msg.chat.id, 'Ответьте на сообщение пользователя, чтобы снять с него роль.');
    return;
  }

  const targetUserId = msg.reply_to_message.from!.id;
  const targetUser = await getUser(targetUserId);

  if (!targetUser || targetUser.clanId !== user.clanId) {
    bot.sendMessage(msg.chat.id, 'Пользователь не состоит в вашем клане.');
    return;
  }

  if (targetUser.role === 'leader') {
    bot.sendMessage(msg.chat.id, 'Нельзя снять роль с лидера.');
    return;
  }

  await updateUser(targetUserId, { role: 'member' });
  bot.sendMessage(msg.chat.id, 'Пользователь разжалован до обычного участника.');
}

async function rules(msg: TelegramBot.Message) {
  const text = `
📜 **Правила игры:**
1. Запрещено использование багов и уязвимостей.
2. Уважайте других игроков, запрещены оскорбления.
3. Лидер клана несет ответственность за свой клан.
4. Администрация оставляет за собой право блокировать нарушителей.

Приятной игры!
  `;
  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
}

async function topClans(msg: TelegramBot.Message) {
  const snapshot = await db.ref('clans').once('value');
  const clans = snapshot.val() || {};

  const sortedClans = Object.values(clans)
    .map((c: any) => ({
      name: c.name,
      tag: c.tag,
      score: (c.level || 1) * 1000 + (c.army || 0) + (c.treasury || 0) / 10
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  let text = '🏆 **Топ 10 кланов:**\n\n';
  sortedClans.forEach((c, index) => {
    text += `${index + 1}. ${c.name} [${c.tag}] - Очки: ${Math.floor(c.score)}\n`;
  });

  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
}

async function renameClan(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может переименовать клан.');
    return;
  }

  const newName = args.join(' ');
  if (!newName) {
    bot.sendMessage(msg.chat.id, 'Укажите новое название клана.');
    return;
  }

  const clan = await getClan(user.clanId);
  const cost = 5000;

  if ((clan.treasury || 0) < cost) {
    bot.sendMessage(msg.chat.id, `Недостаточно средств. Переименование стоит ${cost} монет.`);
    return;
  }

  await updateClan(user.clanId, { name: newName, treasury: clan.treasury - cost });
  bot.sendMessage(msg.chat.id, `Клан успешно переименован в ${newName}!`);
}

async function renameProduction(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || (user.role !== 'leader' && user.role !== 'officer')) {
    bot.sendMessage(msg.chat.id, 'Только лидеры и офицеры могут переименовывать производства.');
    return;
  }

  const clan = await getClan(user.clanId);
  const productions = clan.productions || {};

  if (Object.keys(productions).length === 0) {
    bot.sendMessage(msg.chat.id, 'У клана нет производств.');
    return;
  }

  const newName = args.join(' ');
  if (!newName) {
    bot.sendMessage(msg.chat.id, 'Укажите новое название производства.');
    return;
  }

  // Simplified: rename the first production for now, or need a way to select
  const prodId = Object.keys(productions)[0];
  
  await db.ref(`clans/${user.clanId}/productions/${prodId}/name`).set(newName);
  bot.sendMessage(msg.chat.id, `Производство переименовано в ${newName}!`);
}

async function notifyClan(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || (user.role !== 'leader' && user.role !== 'officer')) {
    bot.sendMessage(msg.chat.id, 'Только лидеры и офицеры могут отправлять уведомления.');
    return;
  }

  const message = args.slice(1).join(' ');
  if (!message) {
    bot.sendMessage(msg.chat.id, 'Укажите текст уведомления.');
    return;
  }

  const clan = await getClan(user.clanId);
  const members = Object.keys(clan.members || {});

  let sent = 0;
  for (const memberId of members) {
    if (memberId !== userId.toString()) {
      try {
        await bot.sendMessage(memberId, `📢 Уведомление от клана ${clan.name}:\n\n${message}`);
        sent++;
      } catch (e) {
        console.error(`Failed to send notification to ${memberId}`);
      }
    }
  }

  bot.sendMessage(msg.chat.id, `Уведомление отправлено ${sent} участникам.`);
}

async function rocketDev(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || (user.role !== 'leader' && user.role !== 'officer')) {
    bot.sendMessage(msg.chat.id, 'Только лидеры и офицеры могут управлять ракетной программой.');
    return;
  }

  const clan = await getClan(user.clanId);
  const cost = 10000;

  if ((clan.treasury || 0) < cost) {
    bot.sendMessage(msg.chat.id, `Недостаточно средств. Разработка ракеты стоит ${cost} монет.`);
    return;
  }

  await updateClan(user.clanId, { treasury: clan.treasury - cost, rockets: (clan.rockets || 0) + 1 });
  bot.sendMessage(msg.chat.id, `🚀 Ракета разработана! Теперь у клана ${ (clan.rockets || 0) + 1 } ракет.`);
}

async function rocketLaunch(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || (user.role !== 'leader' && user.role !== 'officer')) {
    bot.sendMessage(msg.chat.id, 'Только лидеры и офицеры могут запускать ракеты.');
    return;
  }

  const clan = await getClan(user.clanId);
  if ((clan.rockets || 0) <= 0) {
    bot.sendMessage(msg.chat.id, 'У клана нет ракет. Используйте /разработка.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана-цели.');
    return;
  }

  const snapshot = await db.ref('clans').orderByChild('name').equalTo(targetName).once('value');
  const targets = snapshot.val();
  if (!targets) {
    bot.sendMessage(msg.chat.id, 'Клан не найден.');
    return;
  }

  const targetId = Object.keys(targets)[0];
  const targetClan = await getClan(targetId);

  const damage = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;

  await updateClan(user.clanId, { rockets: clan.rockets - 1 });
  await updateClan(targetId, { capitalHp: Math.max(0, (targetClan.capitalHp || 10000) - damage) });

  bot.sendMessage(msg.chat.id, `🚀 Ракета запущена по клану ${targetName}!\nНанесен урон: ${damage} HP.`);

  if ((targetClan.capitalHp || 10000) - damage <= 0) {
    bot.sendMessage(msg.chat.id, `Столица клана ${targetName} уничтожена!`);
  }
}

async function deleteClan(msg: TelegramBot.Message) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может удалить клан.');
    return;
  }

  const clan = await getClan(user.clanId);
  const members = Object.keys(clan.members || {});

  for (const memberId of members) {
    await db.ref(`users/${memberId}/clanId`).remove();
    await db.ref(`users/${memberId}/role`).remove();
  }

  await db.ref(`clans/${user.clanId}`).remove();
  bot.sendMessage(msg.chat.id, 'Клан успешно удален.');
}

async function truce(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может предлагать перемирие.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана.');
    return;
  }

  bot.sendMessage(msg.chat.id, `Вы предложили перемирие клану ${targetName}. Ожидайте ответа.`);
}

async function annex(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может аннексировать кланы.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана.');
    return;
  }

  bot.sendMessage(msg.chat.id, `Вы начали процесс аннексии клана ${targetName}.`);
}

async function ultimatum(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может выдвигать ультиматумы.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана.');
    return;
  }

  bot.sendMessage(msg.chat.id, `Вы выдвинули ультиматум клану ${targetName}.`);
}

async function proposeAlliance(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может предлагать альянс.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана.');
    return;
  }

  bot.sendMessage(msg.chat.id, `Вы предложили альянс клану ${targetName}.`);
}

async function breakAlliance(msg: TelegramBot.Message, args: string[]) {
  const userId = msg.from!.id;
  const user = await getUser(userId);

  if (!user || !user.clanId || user.role !== 'leader') {
    bot.sendMessage(msg.chat.id, 'Только лидер может разрывать альянсы.');
    return;
  }

  const targetName = args.join(' ');
  if (!targetName) {
    bot.sendMessage(msg.chat.id, 'Укажите название клана.');
    return;
  }

  bot.sendMessage(msg.chat.id, `Вы разорвали альянс с кланом ${targetName}.`);
}

async function adminPanel(msg: TelegramBot.Message) {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'ВКЛ/ОТКЛ БОТА', callback_data: 'admin_toggle_bot' },
          { text: 'РЕЖИМ СНА', callback_data: 'admin_sleep' },
          { text: 'РАССЫЛКА', callback_data: 'admin_broadcast' }
        ],
        [
          { text: 'БЭКАП', callback_data: 'admin_backup' },
          { text: 'ОЧИСТКА БД', callback_data: 'admin_clear_db' },
          { text: 'ЗАМОРОЗИТЬ КЛАН', callback_data: 'admin_freeze' }
        ],
        [
          { text: 'РАЗМОРОЗИТЬ КЛАН', callback_data: 'admin_unfreeze' },
          { text: 'ВЫДАТЬ РЕСУРСЫ', callback_data: 'admin_give' },
          { text: 'СНЯТЬ РЕСУРСЫ', callback_data: 'admin_take' }
        ],
        [
          { text: 'Далее ➡️', callback_data: 'admin_page_2' }
        ]
      ]
    }
  };
  bot.sendMessage(msg.chat.id, '🛠 Админ-панель (Страница 1):', opts);
}

// Handle callback queries
bot.on('callback_query', async (query) => {
  const data = query.data;
  const msg = query.message;
  if (!msg) return;
  const userId = query.from.id;

  if (data === 'confirm_create_clan') {
    const pending = pendingClanCreations.get(userId);
    if (!pending) {
      bot.answerCallbackQuery(query.id, { text: 'Действие устарело.' });
      return;
    }

    const { name, tag } = pending;
    pendingClanCreations.delete(userId);

    const clanId = db.ref('clans').push().key!;
    
    await db.ref(`clans/${clanId}`).set({
      name,
      tag,
      leaderId: userId,
      members: { [userId]: { role: 'leader' } },
      treasury: 0,
      weapons: 0,
      capitalHp: 10000,
      level: 1,
      experience: 0,
      populationLimit: 15
    });

    await updateUser(userId, { clanId, role: 'leader', contribution: 0 });

    bot.editMessageText(`Клан создан! Ты лидер`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      reply_markup: {
        inline_keyboard: [
          [{ text: '👁️ Мой клан', callback_data: 'view_my_clan' }]
        ]
      }
    });
    bot.answerCallbackQuery(query.id);
  } else if (data === 'cancel_create_clan') {
    pendingClanCreations.delete(userId);
    bot.editMessageText('Создание клана отменено.', {
      chat_id: msg.chat.id,
      message_id: msg.message_id
    });
    bot.answerCallbackQuery(query.id);
  } else if (data === 'view_my_clan') {
    // Call myClan logic here, but we need to pass a message object.
    // We can just call myClan with a mock message or refactor myClan.
    await myClan({ ...msg, from: query.from } as TelegramBot.Message);
    bot.answerCallbackQuery(query.id);
  } else if (data === 'admin_toggle_bot') {
    const snap = await db.ref('settings/bot_disabled').once('value');
    const disabled = snap.val();
    await db.ref('settings/bot_disabled').set(!disabled);
    bot.answerCallbackQuery(query.id, { text: `Бот ${!disabled ? 'выключен' : 'включен'}` });
  } else if (data === 'admin_page_2') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'ИЗМЕНИТЬ ЦЕНЫ', callback_data: 'admin_prices' },
            { text: 'ЛИМИТ НАСЕЛЕНИЯ', callback_data: 'admin_limit' },
            { text: 'ЛОГИ', callback_data: 'admin_logs' }
          ],
          [
            { text: 'УДАЛИТЬ КЛАН', callback_data: 'admin_delete_clan' },
            { text: 'ТЕСТОВЫЙ РЕЖИМ', callback_data: 'admin_test_mode' },
            { text: 'ВЫХОД', callback_data: 'admin_exit' }
          ],
          [
            { text: '⬅️ Назад', callback_data: 'admin_page_1' }
          ]
        ]
      }
    };
    bot.editMessageText('🛠 Админ-панель (Страница 2):', {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      ...opts
    });
  } else if (data === 'admin_page_1') {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'ВКЛ/ОТКЛ БОТА', callback_data: 'admin_toggle_bot' },
            { text: 'РЕЖИМ СНА', callback_data: 'admin_sleep' },
            { text: 'РАССЫЛКА', callback_data: 'admin_broadcast' }
          ],
          [
            { text: 'БЭКАП', callback_data: 'admin_backup' },
            { text: 'ОЧИСТКА БД', callback_data: 'admin_clear_db' },
            { text: 'ЗАМОРОЗИТЬ КЛАН', callback_data: 'admin_freeze' }
          ],
          [
            { text: 'РАЗМОРОЗИТЬ КЛАН', callback_data: 'admin_unfreeze' },
            { text: 'ВЫДАТЬ РЕСУРСЫ', callback_data: 'admin_give' },
            { text: 'СНЯТЬ РЕСУРСЫ', callback_data: 'admin_take' }
          ],
          [
            { text: 'Далее ➡️', callback_data: 'admin_page_2' }
          ]
        ]
      }
    };
    bot.editMessageText('🛠 Админ-панель (Страница 1):', {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      ...opts
    });
  } else if (data === 'admin_exit') {
    bot.deleteMessage(msg.chat.id, msg.message_id);
  } else if (data === 'admin_test_mode') {
    const snap = await db.ref('settings/test_mode').once('value');
    const testMode = snap.val();
    await db.ref('settings/test_mode').set(!testMode);
    bot.answerCallbackQuery(query.id, { text: `Тестовый режим ${!testMode ? 'включен' : 'выключен'}` });
  } else if (data.startsWith('upg_prod_')) {
    const prodId = data.replace('upg_prod_', '');
    const userId = query.from.id;
    const user = await getUser(userId);
    if (!user || !user.clanId) return;

    const clan = await getClan(user.clanId);
    const prod = clan.productions?.[prodId];
    if (!prod) return;

    if (prod.level >= 2) {
      bot.answerCallbackQuery(query.id, { text: 'Максимальный уровень достигнут.', show_alert: true });
      return;
    }

    if ((clan.treasury || 0) < 1000) {
      bot.answerCallbackQuery(query.id, { text: 'Недостаточно средств в казне (нужно 1000).', show_alert: true });
      return;
    }

    await updateClan(user.clanId, { treasury: clan.treasury - 1000 });
    await db.ref(`clans/${user.clanId}/productions/${prodId}/level`).set(2);

    bot.editMessageText(`✅ Производство ${prod.name} улучшено до уровня 2! Теперь оно дает 10 ед./час.`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id
    });
  } else if (data.startsWith('sell_prod_')) {
    const prodId = data.replace('sell_prod_', '');
    const userId = query.from.id;
    const user = await getUser(userId);
    if (!user || !user.clanId) return;

    const clan = await getClan(user.clanId);
    const prod = clan.productions?.[prodId];
    if (!prod || !prod.amount || prod.amount <= 0) {
      bot.answerCallbackQuery(query.id, { text: 'Нет продукции для продажи.', show_alert: true });
      return;
    }

    const amount = prod.amount;
    const revenue = amount * 10;
    const toTreasury = Math.floor(revenue / 2);
    const toUser = revenue - toTreasury;

    await updateClan(user.clanId, { treasury: (clan.treasury || 0) + toTreasury });
    await db.ref(`clans/${user.clanId}/productions/${prodId}/amount`).set(0);
    await updateUser(userId, { contribution: (user.contribution || 0) + toUser });

    bot.editMessageText(`💰 Продано ${amount} ед. ${prod.name} за ${revenue} монет.\n🏦 В казну: ${toTreasury} монеты\n👤 Вам лично: ${toUser} монеты`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id
    });
  } else if (data === 'upgrade_clan_level') {
    const userId = query.from.id;
    const user = await getUser(userId);
    if (!user || !user.clanId || user.role !== 'leader') {
      bot.answerCallbackQuery(query.id, { text: 'Только лидер может повышать уровень клана.', show_alert: true });
      return;
    }

    const clan = await getClan(user.clanId);
    const currentLevel = clan.level || 1;
    const currentExp = clan.experience || 0;
    const expNeeded = currentLevel * 1000;

    if (currentExp < expNeeded) {
      bot.answerCallbackQuery(query.id, { text: 'Недостаточно опыта.', show_alert: true });
      return;
    }

    await updateClan(user.clanId, {
      level: currentLevel + 1,
      experience: currentExp - expNeeded,
      populationLimit: (clan.populationLimit || 15) + 5
    });

    bot.editMessageText(`🎉 Уровень клана повышен до ${currentLevel + 1}!\nЛимит участников увеличен до ${(clan.populationLimit || 15) + 5}.`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id
    });
  } else if (data.startsWith('upg_fact_')) {
    const factId = data.replace('upg_fact_', '');
    const userId = query.from.id;
    const user = await getUser(userId);
    if (!user || !user.clanId) return;

    const clan = await getClan(user.clanId);
    const fact = clan.factories?.[factId];
    if (!fact) return;

    if ((fact.level || 1) >= 3) {
      bot.answerCallbackQuery(query.id, { text: 'Максимальный уровень достигнут.', show_alert: true });
      return;
    }

    if ((clan.treasury || 0) < 1000) {
      bot.answerCallbackQuery(query.id, { text: 'Недостаточно средств в казне (нужно 1000).', show_alert: true });
      return;
    }

    await updateClan(user.clanId, { treasury: clan.treasury - 1000 });
    await db.ref(`clans/${user.clanId}/factories/${factId}/level`).set((fact.level || 1) + 1);

    bot.editMessageText(`✅ Завод улучшен до уровня ${(fact.level || 1) + 1}!`, {
      chat_id: msg.chat.id,
      message_id: msg.message_id
    });
  }
});

console.log('Bot initialized');

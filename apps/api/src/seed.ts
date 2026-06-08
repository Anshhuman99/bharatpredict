import { PrismaClient } from '@prisma/client';
import { SYSTEM_USER_ID } from '@bharatpredict/types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean up existing database records
  console.log('Cleaning up existing database records...');
  await prisma.transaction.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.holding.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.copyTradingRelation.deleteMany({});
  await prisma.market.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create the primary mock user (Anshuman)
  console.log('Creating primary mock user...');
  const user = await prisma.user.create({
    data: {
      id: SYSTEM_USER_ID,
      username: 'Anshuman',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      walletBalance: 25000.00, // ₹25,000.00 starting balance
    },
  });
  console.log(`Mock user created: ${user.username} with wallet balance: ₹${user.walletBalance}`);

  // Create mock leader users for copy trading
  console.log('Creating mock leader users...');
  const leadersData = [
    {
      id: 'amit-verma-uuid',
      username: 'Amit Verma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      walletBalance: 50000.00,
    },
    {
      id: 'prerna-kapoor-uuid',
      username: 'Prerna Kapoor',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      walletBalance: 45000.00,
    },
    {
      id: 'rajesh-nair-uuid',
      username: 'Rajesh Nair',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      walletBalance: 30000.00,
    },
    {
      id: 'siddharth-sen-uuid',
      username: 'Siddharth Sen',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      walletBalance: 20000.00,
    },
    {
      id: 'neha-sharma-uuid',
      username: 'Neha Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      walletBalance: 22000.00,
    },
    {
      id: 'vikram-mehta-uuid',
      username: 'Vikram Mehta',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
      walletBalance: 18000.00,
    },
    {
      id: 'ananya-roy-uuid',
      username: 'Ananya Roy',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      walletBalance: 15000.00,
    },
    {
      id: 'kunal-patil-uuid',
      username: 'Kunal Patil',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      walletBalance: 12000.00,
    },
  ];

  for (const leader of leadersData) {
    await prisma.user.create({ data: leader });
  }

  // 3. Create high-fidelity Indian prediction markets
  console.log('Seeding prediction markets...');
  
  const marketsData = [
    {
      title: 'Will CSK win the IPL Final match tonight?',
      description: 'Chennai Super Kings (CSK) face Mumbai Indians (MI) in the grand finale of the Indian Premier League. Trades will settle to YES if CSK officially wins the match. Trades will settle to NO if MI wins.',
      category: 'IPL',
      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800',
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      resolved: false,
      liquidity: 150.0,
      yesShares: 120.0,
      noShares: 80.0,
      volume: 12450.0,
      aiConfidence: 64.0,
      marketSentiment: 'Bullish',
      trendingNarrative: 'MS Dhoni\'s tactical death-overs captaincy is giving CSK massive odds at Chepauk.',
    },
    {
      title: 'Will NSE Nifty 50 cross 24,500 by this Friday close?',
      description: 'This market settles to YES if the National Stock Exchange (NSE) Nifty 50 Index closes at or above 24,500.00 on the coming Friday. Settle based on NSE India official records.',
      category: 'Finance',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
      endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      resolved: false,
      liquidity: 200.0,
      yesShares: 90.0,
      noShares: 110.0,
      volume: 48500.0,
      aiConfidence: 45.0,
      marketSentiment: 'Neutral',
      trendingNarrative: 'Inflation concerns limit institutional inflows despite positive local retail purchase volume.',
    },
    {
      title: 'Will BJP win absolute majority in Bihar State Elections?',
      description: 'Settle to YES if Bharatiya Janata Party (BJP) secures 122 or more seats out of 243 in the Bihar Legislative Assembly alone. Settle to NO otherwise.',
      category: 'Politics',
      image: 'https://images.unsplash.com/photo-1599849594582-48e3c2751f04?auto=format&fit=crop&q=80&w=800',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      resolved: false,
      liquidity: 300.0,
      yesShares: 220.0,
      noShares: 180.0,
      volume: 154200.0,
      aiConfidence: 58.0,
      marketSentiment: 'Bullish',
      trendingNarrative: 'Grassroot campaigns and solid seat-sharing deals give NDA a dominant lead in initial surveys.',
    },
    {
      title: 'Will Bollywood\'s "Pathaan 2" cross ₹50 Crore on opening day?',
      description: 'Settle to YES if Pathaan 2 nets ₹50 Crore or more at the domestic Indian box office on its first Friday of release. Settle based on Box Office India metrics.',
      category: 'Bollywood',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      resolved: false,
      liquidity: 120.0,
      yesShares: 75.0,
      noShares: 85.0,
      volume: 18900.0,
      aiConfidence: 71.0,
      marketSentiment: 'Volatile',
      trendingNarrative: 'Massive teaser engagement indicates monumental booking queues across metropolitan single screens.',
    },
  ];

  for (const m of marketsData) {
    const market = await prisma.market.create({
      data: m,
    });
    console.log(`Market seeded: "${market.title}"`);
  }

  // 4. Seed social comments for our markets
  console.log('Seeding discussion comments...');
  const seededMarkets = await prisma.market.findMany({});
  const mockComments = [
    'Dhoni at Chepauk is basically a cheat code. YES is an absolute lock here!',
    'MI bowling lineup has Bumrah back in supreme death overs form. Do not underestimate MI!',
    'CSK middle order is looking extremely volatile. I am betting NO on this.',
    'Nifty looks super bullish after the positive FII flows reported this morning. Easy YES.',
    'Rate cuts are delayed, which will limit domestic stock volumes. NO is the smart trade.',
    'Bihar NDA seat sharing talks are going extremely well. BJP absolute majority looks like a YES.',
    'Bollywood advance bookings are record-breaking. Pathaan 2 ₹50 Crore opening day is a lock!',
  ];

  for (const m of seededMarkets) {
    for (let i = 0; i < 3; i++) {
      const text = mockComments[Math.floor(Math.random() * mockComments.length)];
      await prisma.comment.create({
        data: {
          marketId: m.id,
          userId: SYSTEM_USER_ID,
          text,
          createdAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000), // staggered hours
        },
      });
    }
  }
  console.log('✅ Discussion comments seeded!');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

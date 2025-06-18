import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MySolanaProject } from "../target/types/my_solana_project";

async function runCounterDemo() {
  console.log("🎯 启动计数器程序演示...");
  console.log("=".repeat(50));

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.mySolanaProject as Program<MySolanaProject>;
  const provider = anchor.getProvider();
  
  // Get the user's wallet
  const user = (provider.wallet as anchor.Wallet).payer;

  console.log(`👤 用户地址: ${user.publicKey.toString()}`);
  console.log(`💰 检查账户余额...`);
  
  const balance = await provider.connection.getBalance(user.publicKey);
  console.log(`💰 账户余额: ${(balance / anchor.web3.LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  
  console.log("-".repeat(30));

  // Use seed to derive the counter account address
  const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), user.publicKey.toBuffer()],
    program.programId
  );

  console.log(`📍 计数器PDA地址: ${counterPDA.toString()}`);

  // Check if counter exists
  let counterExists = false;
  try {
    await program.account.counter.fetch(counterPDA);
    counterExists = true;
    console.log("✅ 计数器账户已存在");
  } catch (error) {
    console.log("📝 计数器账户不存在，需要初始化");
  }

  console.log("-".repeat(30));

  if (!counterExists) {
    console.log("🚀 开始初始化计数器...");
    
    // Call the initialize instruction
    const tx = await program.methods
      .initialize()
      .accounts({
        counter: counterPDA,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ 计数器初始化成功!");
    console.log(`📝 初始化交易签名: ${tx}`);
  }

  // Fetch the counter account data and verify
  let counterAccount = await program.account.counter.fetch(counterPDA);
  console.log(`📊 当前计数器值: ${counterAccount.count.toNumber()}`);
  console.log(`👤 权限账户: ${counterAccount.authority.toBase58()}`);
  
  console.log("-".repeat(30));
  console.log("🔄 开始增加计数器...");

  // Increment the counter 3 times
  for (let i = 1; i <= 3; i++) {
    console.log(`⬆️ 第 ${i} 次增加计数器...`);
    
    const tx = await program.methods
      .increment()
      .accounts({
        counter: counterPDA,
        user: user.publicKey,
      })
      .rpc();

    console.log(`📝 增量交易签名: ${tx}`);

    // Fetch the updated counter value
    counterAccount = await program.account.counter.fetch(counterPDA);
    console.log(`📊 新的计数器值: ${counterAccount.count.toNumber()}`);
    console.log("-".repeat(30));
  }

  console.log("🎉 计数器演示完成!");
  console.log(`🏁 最终计数器值: ${counterAccount.count.toNumber()}`);
}

// 主函数
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case "demo":
      case undefined:
        await runCounterDemo();
        break;
      case "init":
        console.log("🚀 仅初始化计数器...");
        anchor.setProvider(anchor.AnchorProvider.env());
        const program = anchor.workspace.mySolanaProject as Program<MySolanaProject>;
        const provider = anchor.getProvider();
        const user = (provider.wallet as anchor.Wallet).payer;
        const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("counter"), user.publicKey.toBuffer()],
          program.programId
        );

        const tx = await program.methods
          .initialize()
          .accounts({
            counter: counterPDA,
            user: user.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        console.log(`✅ 初始化完成! 交易: ${tx}`);
        break;
      default:
        console.log("📖 使用方法:");
        console.log("  npx ts-node scripts/counter_script.ts [demo|init]");
        console.log("");
        console.log("  demo (默认) - 运行完整演示");
        console.log("  init        - 仅初始化计数器");
        break;
    }
  } catch (error) {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}
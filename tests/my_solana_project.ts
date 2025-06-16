import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MySolanaProject } from "../target/types/my_solana_project";
import { expect } from "chai";

describe("my_solana_project", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.mySolanaProject as Program<MySolanaProject>;
  const provider = anchor.getProvider();
  
  // Get the user's wallet
  const user = (provider.wallet as anchor.Wallet).payer;

  it("初始化计数器", async () => {
    // Use seed to derive the counter account address
    const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.publicKey.toBuffer()],
      program.programId
    );

    // Call the initialize instruction
    const tx = await program.methods
      .initialize()
      .accounts({
        counter: counterPDA,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("初始化交易签名:", tx);

    // Fetch the counter account data and verify
    const counterAccount = await program.account.counter.fetch(counterPDA);
    expect(counterAccount.count.toNumber()).to.equal(0);
    expect(counterAccount.authority.toBase58()).to.equal(user.publicKey.toBase58());
    
    console.log("✅ 计数器初始化成功，初始值:", counterAccount.count.toNumber());
  });

  it("增加计数器", async () => {
    // Use seed to derive the counter account address
    const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.publicKey.toBuffer()],
      program.programId
    );

    // Call the increment instruction
    const tx = await program.methods
      .increment()
      .accounts({
        counter: counterPDA,
        user: user.publicKey,
      })
      .rpc();

    console.log("增量交易签名:", tx);

    // Fetch the counter account data and verify
    const counterAccount = await program.account.counter.fetch(counterPDA);
    expect(counterAccount.count.toNumber()).to.equal(1);
    
    console.log("✅ 计数器增加成功，当前值:", counterAccount.count.toNumber());
  });

  it("多次增加计数器", async () => {
    // Use seed to derive the counter account address
    const [counterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.publicKey.toBuffer()],
      program.programId
    );

    // Call the increment instruction 3 times in a row
    for (let i = 0; i < 3; i++) {
      await program.methods
        .increment()
        .accounts({
          counter: counterPDA,
          user: user.publicKey,
        })
        .rpc();
    }

    // Fetch the final counter value
    const counterAccount = await program.account.counter.fetch(counterPDA);
    expect(counterAccount.count.toNumber()).to.equal(4); // Initial value 0 + 1 + 3 = 4
    
    console.log("✅ 多次增加后计数器值:", counterAccount.count.toNumber());
  });
});

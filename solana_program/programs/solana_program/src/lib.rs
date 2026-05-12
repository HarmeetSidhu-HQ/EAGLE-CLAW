use anchor_lang::prelude::*;

declare_id!("DshFgJnkCjpg4zbdg3fsrxJmjfZ7xUTBVj4ETQbXbQgm");  // We will update this later!

#[program]
pub mod eagle_claw {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, recipient: Pubkey, threshold: i64) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        switch.owner = ctx.accounts.user.key();
        switch.recipient = recipient;
        switch.threshold = threshold;
        switch.last_heartbeat = Clock::get()?.unix_timestamp;
        switch.is_triggered = false;
        Ok(())
    }

    pub fn heartbeat(ctx: Context<Heartbeat>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        // Only the owner can poke the heartbeat
        require_keys_eq!(switch.owner, ctx.accounts.user.key(), ErrorCode::Unauthorized);
        
        switch.last_heartbeat = Clock::get()?.unix_timestamp;
        msg!("Heartbeat detected! Timer reset for owner: {:?}", switch.owner);
        Ok(())
    }

    pub fn trigger_release(ctx: Context<Trigger>) -> Result<()> {
        let switch = &mut ctx.accounts.switch;
        let current_time = Clock::get()?.unix_timestamp;

        // The core logic: Is current_time > last_heartbeat + threshold?
        let time_elapsed = current_time - switch.last_heartbeat;
        
        require!(
            time_elapsed > switch.threshold,
            ErrorCode::TooEarly
        );

        switch.is_triggered = true;
        msg!("EAGLE CLAW Triggered! Data/Assets are now releasable to: {:?}", switch.recipient);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 32 + 8 + 8 + 1)]
    pub switch: Account<'info, SwitchAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Heartbeat<'info> {
    #[account(mut)]
    pub switch: Account<'info, SwitchAccount>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Trigger<'info> {
    #[account(mut)]
    pub switch: Account<'info, SwitchAccount>,
}

#[account]
pub struct SwitchAccount {
    pub owner: Pubkey,
    pub recipient: Pubkey,
    pub last_heartbeat: i64,
    pub threshold: i64,
    pub is_triggered: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not the owner of this switch.")]
    Unauthorized,
    #[msg("The threshold has not been met yet. The owner might still be active.")]
    TooEarly,
}
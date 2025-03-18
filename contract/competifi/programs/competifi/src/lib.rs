use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("Ae9WRFzaJBd5pfLBHphQdnfS3qa5qEtruPfMfro2n5ko");

#[program]
pub mod run_stake {
    use super::*;

    // Initialize the staking pool
    pub fn initialize_pool(ctx: Context<InitializePool>, min_stake_amount: u64, lock_period: i64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.stake_vault = ctx.accounts.stake_vault.key();
        pool.total_staked = 0;
        pool.min_stake_amount = min_stake_amount;
        pool.lock_period = lock_period;
        pool.stakers_count = 0;
        
        Ok(())
    }

    // Stake SOL into the pool
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;
        
        // Check minimum stake amount
        require!(amount >= pool.min_stake_amount, ErrorCode::InsufficientStakeAmount);
        
        // Transfer tokens from user to stake vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.stake_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        // Update user stake info
        let user_stake = &mut ctx.accounts.user_stake;
        let is_new_staker = user_stake.amount == 0;
        
        user_stake.user = ctx.accounts.user.key();
        user_stake.pool = pool.key();
        user_stake.amount += amount;
        user_stake.last_stake_timestamp = clock.unix_timestamp;
        user_stake.last_claim_timestamp = clock.unix_timestamp;
        
        // Update pool info
        pool.total_staked += amount;
        if is_new_staker {
            pool.stakers_count += 1;
        }
        
        emit!(StakeEvent {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            amount,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }

    // Unstake SOL from the pool
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;
        
        // Check user has enough staked
        require!(amount <= user_stake.amount, ErrorCode::InsufficientStakedAmount);
        
        // Check lock period
        require!(
            clock.unix_timestamp - user_stake.last_stake_timestamp >= pool.lock_period,
            ErrorCode::StakeLocked
        );
        
        // Transfer tokens from stake vault to user
        let pool_seeds = &[
            b"pool".as_ref(),
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&pool_seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.stake_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;
        
        // Update user stake info
        user_stake.amount -= amount;
        if user_stake.amount == 0 {
            pool.stakers_count -= 1;
        }
        
        // Update pool info
        pool.total_staked -= amount;
        
        emit!(UnstakeEvent {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            amount,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }

    // Claim rewards based on running activity
    pub fn claim_rewards(ctx: Context<ClaimRewards>, run_distance: u64, run_timestamp: i64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let oracle = &ctx.accounts.oracle;
        let clock = Clock::get()?;
        
        // Verify oracle signature (in production, implement proper verification)
        require!(oracle.key() == pool.oracle, ErrorCode::InvalidOracle);
        
        // Verify run timestamp is after last claim and before current time
        require!(
            run_timestamp > user_stake.last_claim_timestamp && run_timestamp <= clock.unix_timestamp,
            ErrorCode::InvalidRunTimestamp
        );
        
        // Calculate rewards based on distance and stake amount
        // This is a simple example - implement your own reward algorithm
        let reward_amount = calculate_rewards(run_distance, user_stake.amount)?;
        
        // Transfer rewards from reward vault to user
        let pool_seeds = &[
            b"pool".as_ref(),
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&pool_seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.reward_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, reward_amount)?;
        
        // Update user claim timestamp
        user_stake.last_claim_timestamp = clock.unix_timestamp;
        
        emit!(ClaimRewardEvent {
            user: ctx.accounts.user.key(),
            pool: pool.key(),
            run_distance,
            reward_amount,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }
}

// Account structures
#[account]
pub struct StakePool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub oracle: Pubkey,
    pub total_staked: u64,
    pub min_stake_amount: u64,
    pub lock_period: i64,
    pub stakers_count: u64,
    pub bump: u8,
}

#[account]
pub struct UserStake {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub last_stake_timestamp: i64,
    pub last_claim_timestamp: i64,
}

// Context structures
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1)]
    pub pool: Account<'info, StakePool>,
    pub token_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = pool,
    )]
    pub stake_vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = pool,
    )]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub oracle: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakePool>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 8 + 8 + 8,
        seeds = [b"user_stake", pool.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = pool.stake_vault)]
    pub stake_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakePool>,
    #[account(mut, seeds = [b"pool", pool.token_mint.as_ref()], bump = pool.bump)]
    pub pool_authority: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"user_stake", pool.key().as_ref(), user.key().as_ref()],
        bump,
        constraint = user_stake.user == user.key() && user_stake.pool == pool.key()
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = pool.stake_vault)]
    pub stake_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakePool>,
    #[account(mut, seeds = [b"pool", pool.token_mint.as_ref()], bump = pool.bump)]
    pub pool_authority: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"user_stake", pool.key().as_ref(), user.key().as_ref()],
        bump,
        constraint = user_stake.user == user.key() && user_stake.pool == pool.key()
    )]
    pub user_stake: Account<'info, UserStake>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut, address = pool.reward_vault)]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub oracle: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

// Events
#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimRewardEvent {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub run_distance: u64,
    pub reward_amount: u64,
    pub timestamp: i64,
}

// Helper functions
fn calculate_rewards(distance: u64, stake_amount: u64) -> Result<u64> {
    // Implement your reward algorithm here
    // Example: 0.01 SOL per km, multiplied by stake factor
    let base_reward = distance.checked_mul(10_000_000).unwrap_or(0); // 0.01 SOL in lamports per km
    let stake_factor = stake_amount.checked_div(1_000_000_000).unwrap_or(1).max(1); // 1 SOL = factor of 1
    let reward = base_reward.checked_mul(stake_factor).unwrap_or(0);
    
    Ok(reward)
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient stake amount")]
    InsufficientStakeAmount,
    #[msg("Insufficient staked amount for withdrawal")]
    InsufficientStakedAmount,
    #[msg("Stake is locked for the specified period")]
    StakeLocked,
    #[msg("Invalid oracle")]
    InvalidOracle,
    #[msg("Invalid run timestamp")]
    InvalidRunTimestamp,
}
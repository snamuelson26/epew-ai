/**
 * SupabaseRepository.ts
 * Generic Supabase repository for EPEW-EDE-IBOS
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, RepositoryException, RepositoryErrorCode, type IRepositoryAdapter, type RepositoryContext, type RepositoryPage, type RepositoryQuery } from "./BaseRepository";
import type { UUID } from "../services/BaseService";

export class SupabaseRepository<TEntity extends Record<string, any>, TCreate, TUpdate, TFilter>
  extends BaseRepository<TEntity, TCreate, TUpdate, TFilter>
{
  constructor(
    protected readonly client: SupabaseClient,
    protected readonly table: string
  ) {
    super(new SupabaseAdapter<TEntity,TCreate,TUpdate,TFilter>(client, table));
  }
}

class SupabaseAdapter<TEntity extends Record<string, any>, TCreate, TUpdate, TFilter>
implements IRepositoryAdapter<TEntity,TCreate,TUpdate,TFilter> {

  constructor(
    private readonly client: SupabaseClient,
    private readonly table: string
  ) {}

  async insert(dto:TCreate):Promise<TEntity>{
    const {data,error}=await this.client.from(this.table).insert(dto as any).select().single();
    if(error) throw this.wrap(error);
    return data as TEntity;
  }

  async selectById(id:UUID):Promise<TEntity|null>{
    const {data,error}=await this.client.from(this.table).select("*").eq("id",id).maybeSingle();
    if(error) throw this.wrap(error);
    return data as TEntity|null;
  }

  async updateById(id:UUID,dto:TUpdate):Promise<TEntity>{
    const payload:any={...dto,updated_at:new Date().toISOString()};
    const {data,error}=await this.client.from(this.table).update(payload).eq("id",id).select().single();
    if(error) throw this.wrap(error);
    return data as TEntity;
  }

  async softDeleteById(id:UUID):Promise<void>{
    const {error}=await this.client.from(this.table).update({deleted_at:new Date().toISOString()}).eq("id",id);
    if(error) throw this.wrap(error);
  }

  async restoreById(id:UUID):Promise<void>{
    const {error}=await this.client.from(this.table).update({deleted_at:null}).eq("id",id);
    if(error) throw this.wrap(error);
  }

  async selectPage(query:RepositoryQuery<TFilter>, _context?:RepositoryContext):Promise<RepositoryPage<TEntity>>{
    let builder=this.client.from(this.table).select("*",{count:"exact"});
    const filter=query.filter as any;
    if(filter){
      for(const [k,v] of Object.entries(filter)){
        if(v!==undefined && v!==null){
          builder=builder.eq(k,v);
        }
      }
    }
    if(query.sort){
      for(const s of query.sort){
        builder=builder.order(s.field,{ascending:s.direction!=="desc"});
      }
    }
    const from=(query.pagination.page-1)*query.pagination.pageSize;
    const to=from+query.pagination.pageSize-1;
    const {data,error,count}=await builder.range(from,to);
    if(error) throw this.wrap(error);
    return {items:(data??[]) as TEntity[], totalItems:count??0};
  }

  private wrap(error:any):RepositoryException{
    return new RepositoryException(
      RepositoryErrorCode.DATABASE_ERROR,
      error?.message ?? "Supabase database error",
      {error}
    );
  }
}
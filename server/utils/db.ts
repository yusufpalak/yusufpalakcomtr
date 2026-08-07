import postgres from 'postgres';import {drizzle} from 'drizzle-orm/postgres-js';import * as schema from '../database/schema'
let client:ReturnType<typeof postgres>|undefined
export function useDb(){const config=useRuntimeConfig();if(!config.databaseUrl)throw createError({statusCode:503,statusMessage:'Veritabanı yapılandırılmamış.'});client??=postgres(config.databaseUrl as string,{max:10,prepare:false});return drizzle(client,{schema})}

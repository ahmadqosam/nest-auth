
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(config: ConfigService) {
        const url = config.get('DATABASE_URL');
        const finalUrl = url || 'file:./prisma/dev.db';

        const authToken = config.get('DB_TOKEN');

        const adapter = new PrismaLibSql({
            url: finalUrl,
            authToken
        });

        super({ adapter });
    }
    async onModuleInit() {
        await this.$connect();
    }
}

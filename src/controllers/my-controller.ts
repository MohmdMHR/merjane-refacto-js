/* eslint-disable @typescript-eslint/switch-exhaustiveness-check */

/* eslint-disable no-await-in-loop */
import {eq} from 'drizzle-orm';
import fastifyPlugin from 'fastify-plugin';
import {serializerCompiler, validatorCompiler, type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {orders, products, type Product} from '@/db/schema.js';
import type {Database} from '@/db/type.ts';
import type {INotificationService} from '@/services/notifications.port.ts';

export const myController = fastifyPlugin(async server => {
	// Add schema validator and serializer
	server.setValidatorCompiler(validatorCompiler);
	server.setSerializerCompiler(serializerCompiler);

	server.withTypeProvider<ZodTypeProvider>().post('/orders/:orderId/processOrder', {
		schema: {
			params: z.object({
				orderId: z.coerce.number(),
			}),
		},
	}, async (request, reply) => {
		const dbse = server.diContainer.resolve('db');
		const ps = server.diContainer.resolve('ns')  as INotificationService;
		const order = (await dbse.query.orders
			.findFirst({
				where: eq(orders.id, request.params.orderId),
				with: {
					products: {
						columns: {},
						with: {
							product: true,
						},
					},
				},
			}))!;
		const {products: productList} = order;

		if (productList) {
			for (const {product} of productList) {
				switch (product.type) {
					case 'NORMAL': {
						await processNormalProduct(product, dbse, ps);
						break;
					}

					case 'SEASONAL': {
						await processSeasonalProduct(product, dbse, ps);
						break;
					}

					case 'EXPIRABLE': {
						await processExpirableProduct(product, dbse, ps);
						break;
					}
				}
			}
		}

		await reply.send({orderId: order.id});
	});

	async function processNormalProduct(product: Product, database: Database, ps: INotificationService): Promise<void> {
		if (product.available > 0) {
			product.available -= 1;
			await database.update(products).set(product).where(eq(products.id, product.id));
		} else {
			const {leadTime} = product;
			if (leadTime > 0) {
				ps.sendDelayNotification(product.leadTime, product.name);
			}
		}
	}

	async function processSeasonalProduct(product: Product, database: Database, ps: INotificationService): Promise<void> {
		const currentDate = new Date();

		const isInSeason
			= currentDate > (product.seasonStartDate!)
			&& currentDate < (product.seasonEndDate!);

		if (isInSeason && product.available > 0) {
			product.available -= 1;
			await database.update(products).set(product).where(eq(products.id, product.id));
		} else {
			ps.sendOutOfStockNotification(product.name);
		}
	}

	async function processExpirableProduct(product: Product, database: Database, ps: INotificationService): Promise<void> {
		const currentDate = new Date();

		const isValid
			= product.available > 0
			&& (product.expiryDate!) > currentDate;

		if (isValid) {
			product.available -= 1;
			await database.update(products).set(product).where(eq(products.id, product.id));
		} else {
			ps.sendExpirationNotification(product.name, product.expiryDate!);
		}
	}
});


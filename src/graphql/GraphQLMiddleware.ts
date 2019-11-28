import { Injectable, MiddlewareFunction, NestMiddleware } from '@nestjs/common';
import { GraphQLFactory } from '@nestjs/graphql';
import { graphqlExpress } from 'apollo-server-express';
import { GraphQLDateTime, GraphQLTime } from 'graphql-iso-date';
import * as _ from 'lodash';
import { fileLoader, mergeTypes } from 'merge-graphql-schemas';
import { rootLogger } from '../index';

@Injectable()
export class GraphQLMiddleware implements NestMiddleware {
  constructor(private readonly graphqlFactory: GraphQLFactory) {}

  private generateSchema = () => {
    const appTypeDefs = fileLoader('./src/**/*.graphqls');
    const libTypeDefs = fileLoader('./node_modules/@3wks/gae-node-nestjs/dist/**/*.graphqls');

    const typeDefs = mergeTypes([...appTypeDefs, ...libTypeDefs]);

    return this.graphqlFactory.createSchema({
      typeDefs,
      resolvers: {
        Time: GraphQLTime,
        DateAndTime: GraphQLDateTime,
      },
      logger: {
        log: payload => {
          if (typeof payload === 'string') {
            rootLogger.info(payload);
          } else {
            // NestJS will log unexpected (i.e. non HttpException) errors for us - so log
            // here as warn level to prevent raising error alerts for non-fatal errors.
            rootLogger.warn(payload);
          }
        },
      },
    });
  };

  resolve(...args: any[]): MiddlewareFunction {
    const schema = this.generateSchema();
    return graphqlExpress(async req => {
      return {
        schema,
        rootValue: req,
        context: _.get(req, 'context'),
      };
    });
  }
}

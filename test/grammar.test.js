import { buildTag, Context, AgastContext } from 'bablr';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-en-scheme';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { buildFullyQualifiedSpamMatcher } from '@bablr/helpers/builders';

let enhancers = {};

// enhancers = debugEnhancers;

const ctx = Context.from(AgastContext.create(), language, enhancers.bablrProduction);

const buildSchemeTag = (type) => {
  const matcher = buildFullyQualifiedSpamMatcher({ hasGap: true }, language.canonicalURL, type);
  return buildTag(ctx, matcher, undefined, { enhancers });
};

const print = (tree) => {
  return printPrettyCSTML(tree, { ctx });
};

describe('@bablr/language-en-scheme', () => {
  describe('SExpression', () => {
    const scheme = buildSchemeTag('SExpression');

    it('`()`', () => {
      expect(print(scheme`()`)).toEqual(dedent`\

    `);
    });

    it.skip('`""`', () => {
      expect(print(scheme`""`)).toEqual(dedent`\
`);
    });

    it.skip('`" "`', () => {
      expect(print(scheme`" "`)).toEqual(dedent`\

        `);
    });
  });
});

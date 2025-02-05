import { buildTag, Context } from 'bablr';
import { dedent } from '@qnighy/dedent';
import * as language from '@bablr/language-en-scheme';
import { debugEnhancers } from '@bablr/helpers/enhancers';
import { expect } from 'expect';
import { printPrettyCSTML } from '@bablr/helpers/tree';
import { spam } from '@bablr/boot';
import { buildIdentifier, buildString } from '@bablr/helpers/builders';

let enhancers = {};

// enhancers = debugEnhancers;

const ctx = Context.from(language, enhancers.bablrProduction);

const buildSchemeTag = (type) => {
  const matcher = spam`<$${buildString(language.canonicalURL)}:${buildIdentifier(type)} />`;
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
        <!0:cstml { bablrLanguage: 'https://github.com/bablr-lang/language-en-scheme' }>
        <$>
          .:
          <$SExpression>
            openToken: <*Punctuator '(' { balanced: '(', balancedSpan: 'SExpression' } />
            closeToken: <*Punctuator ')' { balancer: true } />
          </>
        </>
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

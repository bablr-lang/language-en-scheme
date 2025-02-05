import { i, spam as m } from '@bablr/boot';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { buildString, buildBoolean, buildIdentifier } from '@bablr/helpers/builders';
import { Node, CoveredBy, AllowEmpty, InjectFrom } from '@bablr/helpers/decorators';
import * as Space from '@bablr/language-en-blank-space';
import { eat } from '@bablr/helpers/grammar';

export const dependencies = { Space };

export const canonicalURL = 'https://github.com/bablr-lang/language-en-scheme';

export const escapables = new Map(
  Object.entries({
    n: '\n',
    r: '\r',
    t: '\t',
  }),
);

export const grammar = triviaEnhancer(
  {
    triviaIsAllowed: (s) => s.span === 'Bare',
    *eatMatchTrivia() {
      if (yield i`match(/[ \n\r\t]/)`) {
        yield i`eat(#:<*Space:Space />)`;
      }
    },
  },
  class SchemeGrammar {
    *[Symbol.for('@bablr/fragment')]({ value: { productionName } }) {
      // needed for the trivia plugin
      yield eat(m`<${buildIdentifier(productionName)} />`);
    }

    @Node
    *SExpression() {
      yield i`eat(openToken: <*Punctuator '(' {balanced: '(' balancedSpan: 'SExpression'} />)`;
      yield i`eatMatch(<Any /> [
        <NullTag 'null' />
      ])`;
      yield i`eat(closeToken: <*Punctuator ')' { balancer: true } />)`;
    }

    @Node
    *String() {
      yield i`eat(openToken: <*Punctuator '"' { balanced: '"', balancedSpan:'String' } />)`;
      yield i`eat(content: <*StringContent />)`;
      yield i`eat(closeToken: <*Punctuator '"' { balancer: true } />)`;
    }

    @AllowEmpty
    @Node
    *StringContent() {
      let esc, lit;
      do {
        esc = (yield i`match('\\')`) && (yield i`eat(@:<EscapeSequence />)`);
        lit = yield i`eatMatch(/[^\r\n\\"\g]+/)`;
      } while (esc || lit);
    }

    @CoveredBy('Expression')
    @Node
    *Number() {
      yield i`eat(wholePart: <Integer /> { noDoubleZero: true matchSign: '-' })`;

      let fs = yield i`eatMatch(fractionalSeparatorToken: <*Punctuator '.' />)`;

      if (fs) {
        yield i`eat(fractionalPart: <Integer />)`;
      } else {
        yield i`eat(fractionalPart: null)`;
      }

      let es = yield i`eatMatch(exponentSeparatorToken: <*Punctuator /[eE]/ />)`;

      if (es) {
        yield i`eat(exponentPart: <Integer /> { matchSign: /[+-]/ })`;
      } else {
        yield i`eat(exponentPart: null)`;
      }
    }

    @Node
    *Integer({ value: props, ctx }) {
      const { matchSign = null } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield i`eatMatch(signToken: <*Punctuator ${matchSign} />)`;
      } else {
        yield i`eat(signToken: null)`;
      }

      yield i`eat(value: <*UnsignedInteger />)`;
    }

    @Node
    *UnsignedInteger() {
      yield i`eat(/\d+/)`;
    }

    @CoveredBy('Expression')
    @Node
    *Boolean() {
      yield i`eat(sigilToken: <*Keyword /#t|#f/ />)`;
    }

    @CoveredBy('Expression')
    @Node
    *Null() {
      yield i`eat(sigilToken: <*Keyword 'null' />)`;
    }

    @Node
    @InjectFrom(productions)
    *Keyword() {}

    @Node
    @InjectFrom(productions)
    *Punctuator() {}

    @AllowEmpty
    @InjectFrom(productions)
    *List() {}

    @InjectFrom(productions)
    *Any() {}
  },
);

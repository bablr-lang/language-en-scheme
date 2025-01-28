import { i } from '@bablr/boot/shorthand.macro';
import { triviaEnhancer } from '@bablr/helpers/trivia';
import * as productions from '@bablr/helpers/productions';
import { buildString, buildBoolean } from '@bablr/helpers/builders';
import { Node, CoveredBy, AllowEmpty, InjectFrom } from '@bablr/helpers/decorators';
import * as Space from '@bablr/language-en-blank-space';

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
        yield i`eat(<#*Space:Space />)`;
      }
    },
  },
  class SchemeGrammar {
    *[Symbol.for('@bablr/fragment')]() {
      // needed for the trivia plugin
      yield i`eat(< />)`;
    }

    @Node
    *SExpression() {
      yield i`eat(<*Puncuator '(' balanced='(' balancedSpan='SExpression'/> 'openToken')`;
      yield i`eat(<*Punctuator ')' balancer /> 'closeToken')`;
    }

    @Node
    *String() {
      yield i`eat(<*Punctuator '"' balanced='"' balancedSpan='String' /> 'openToken')`;
      yield i`eat(<*StringContent /> 'content')`;
      yield i`eat(<*Punctuator '"' balancer /> 'closeToken')`;
    }

    @AllowEmpty
    @Node
    *StringContent() {
      let esc, lit;
      do {
        esc = (yield i`match('\\')`) && (yield i`eat(<@EscapeSequence />)`);
        lit = yield i`eatMatch(/[^\r\n\\"\g]+/)`;
      } while (esc || lit);
    }

    @CoveredBy('SExpression')
    @Node
    *Number() {
      yield i`eat(<Integer /> 'wholePart' { noDoubleZero: true matchSign: '-' })`;

      let fs = yield i`eatMatch(<*Punctuator '.' /> 'fractionalSeparatorToken')`;

      if (fs) {
        yield i`eat(<Integer /> 'fractionalPart')`;
      } else {
        yield i`eat(null 'fractionalPart')`;
      }

      let es = yield i`eatMatch(<*Punctuator /[eE]/ /> 'exponentSeparatorToken')`;

      if (es) {
        yield i`eat(<Integer /> 'exponentPart' { matchSign: /[+-]/ })`;
      } else {
        yield i`eat(null 'exponentPart')`;
      }
    }

    @Node
    *Integer({ value: props, ctx }) {
      const { matchSign = null, noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      if (matchSign) {
        yield i`eatMatch(<*Punctuator ${matchSign} /> 'signToken')`;
      } else {
        yield i`eat(null 'signToken')`;
      }

      yield i`eat(<*UnsignedInteger noDoubleZero=${buildBoolean(noDoubleZero)} /> 'value')`;
    }

    @Node
    *UnsignedInteger({ value: props, ctx }) {
      const { noDoubleZero = false } = (props && ctx.unbox(props)) || {};

      let [firstDigit] = ctx.allTagsFor(yield i`eat(/\d/)`);

      if (!noDoubleZero || firstDigit.value !== '0') {
        yield i`eatMatch(/\d+/)`;
      }
    }

    @CoveredBy('SExpression')
    @Node
    *Boolean() {
      yield i`eat(<*Keyword /#t|#f/ /> 'sigilToken')`;
    }

    @CoveredBy('SExpression')
    @Node
    *Null() {
      yield i`eat(<*Keyword 'null' /> 'sigilToken')`;
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

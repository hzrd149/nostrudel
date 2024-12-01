/* eslint-env jest */

const {decode} = require('..')

describe('decoding', () => {
  it('should decode an invoice', () => {
    let inv = decode(
      'lnbc20u1p3y0x3hpp5743k2g0fsqqxj7n8qzuhns5gmkk4djeejk3wkp64ppevgekvc0jsdqcve5kzar2v9nr5gpqd4hkuetesp5ez2g297jduwc20t6lmqlsg3man0vf2jfd8ar9fh8fhn2g8yttfkqxqy9gcqcqzys9qrsgqrzjqtx3k77yrrav9hye7zar2rtqlfkytl094dsp0ms5majzth6gt7ca6uhdkxl983uywgqqqqlgqqqvx5qqjqrzjqd98kxkpyw0l9tyy8r8q57k7zpy9zjmh6sez752wj6gcumqnj3yxzhdsmg6qq56utgqqqqqqqqqqqeqqjq7jd56882gtxhrjm03c93aacyfy306m4fq0tskf83c0nmet8zc2lxyyg3saz8x6vwcp26xnrlagf9semau3qm2glysp7sv95693fphvsp54l567'
    )
    expect(inv).toEqual({
      paymentRequest:
        'lnbc20u1p3y0x3hpp5743k2g0fsqqxj7n8qzuhns5gmkk4djeejk3wkp64ppevgekvc0jsdqcve5kzar2v9nr5gpqd4hkuetesp5ez2g297jduwc20t6lmqlsg3man0vf2jfd8ar9fh8fhn2g8yttfkqxqy9gcqcqzys9qrsgqrzjqtx3k77yrrav9hye7zar2rtqlfkytl094dsp0ms5majzth6gt7ca6uhdkxl983uywgqqqqlgqqqvx5qqjqrzjqd98kxkpyw0l9tyy8r8q57k7zpy9zjmh6sez752wj6gcumqnj3yxzhdsmg6qq56utgqqqqqqqqqqqeqqjq7jd56882gtxhrjm03c93aacyfy306m4fq0tskf83c0nmet8zc2lxyyg3saz8x6vwcp26xnrlagf9semau3qm2glysp7sv95693fphvsp54l567',
      sections: [
        {
          name: 'lightning_network',
          letters: 'ln'
        },
        {
          name: 'coin_network',
          letters: 'bc',
          value: {
            bech32: 'bc',
            pubKeyHash: 0,
            scriptHash: 5,
            validWitnessVersions: [0]
          }
        },
        {
          name: 'amount',
          letters: '20u',
          value: '2000000'
        },
        {
          name: 'separator',
          letters: '1'
        },
        {
          name: 'timestamp',
          letters: 'p3y0x3h',
          value: 1648859703
        },
        {
          name: 'payment_hash',
          tag: 'p',
          letters: 'pp5743k2g0fsqqxj7n8qzuhns5gmkk4djeejk3wkp64ppevgekvc0js',
          value:
            'f5636521e98000697a6700b979c288ddad56cb3995a2eb07550872c466ccc3e5'
        },
        {
          name: 'description',
          tag: 'd',
          letters: 'dqcve5kzar2v9nr5gpqd4hkuete',
          value: 'fiatjaf:  money'
        },
        {
          name: 'payment_secret',
          tag: 's',
          letters: 'sp5ez2g297jduwc20t6lmqlsg3man0vf2jfd8ar9fh8fhn2g8yttfkq',
          value:
            'c8948517d26f1d853d7afec1f8223becdec4aa4969fa32a6e74de6a41c8b5a6c'
        },
        {
          name: 'expiry',
          tag: 'x',
          letters: 'xqy9gcq',
          value: 172800
        },
        {
          name: 'min_final_cltv_expiry',
          tag: 'c',
          letters: 'cqzys',
          value: 144
        },
        {
          name: 'feature_bits',
          tag: '9',
          letters: '9qrsgq',
          value: {
            option_data_loss_protect: 'unsupported',
            initial_routing_sync: 'unsupported',
            option_upfront_shutdown_script: 'unsupported',
            gossip_queries: 'unsupported',
            var_onion_optin: 'required',
            gossip_queries_ex: 'unsupported',
            option_static_remotekey: 'unsupported',
            payment_secret: 'required',
            basic_mpp: 'unsupported',
            option_support_large_channel: 'unsupported',
            extra_bits: {
              start_bit: 20,
              bits: [],
              has_required: false
            }
          }
        },
        {
          name: 'route_hint',
          tag: 'r',
          letters:
            'rzjqtx3k77yrrav9hye7zar2rtqlfkytl094dsp0ms5majzth6gt7ca6uhdkxl983uywgqqqqlgqqqvx5qqjq',
          value: [
            {
              pubkey:
                '02cd1b7bc418fac2dc99f0ba350d60fa6c45fde5ab6017ee14df6425df485fb1dd',
              short_channel_id: '72edb1be53c78472',
              fee_base_msat: 1000,
              fee_proportional_millionths: 50000,
              cltv_expiry_delta: 144
            }
          ]
        },
        {
          name: 'route_hint',
          tag: 'r',
          letters:
            'rzjqd98kxkpyw0l9tyy8r8q57k7zpy9zjmh6sez752wj6gcumqnj3yxzhdsmg6qq56utgqqqqqqqqqqqeqqjq',
          value: [
            {
              pubkey:
                '034a7b1ac1239ff2ac8438ce0a7ade1048514b77d4322f514e96918e6c13944861',
              short_channel_id: '5db0da3400535c5a',
              fee_base_msat: 0,
              fee_proportional_millionths: 100,
              cltv_expiry_delta: 144
            }
          ]
        },
        {
          name: 'signature',
          letters:
            '7jd56882gtxhrjm03c93aacyfy306m4fq0tskf83c0nmet8zc2lxyyg3saz8x6vwcp26xnrlagf9semau3qm2glysp7sv95693fphvsp',
          value:
            'f49b4d1cea42cd71cb6f8e0b1ef7044922fd6ea903d70b24f1c3e7bcace2c2be621111874473698ec055a34c7fea1258677de441b523e4807d06169a2c521bb201'
        },
        {
          name: 'checksum',
          letters: '54l567'
        }
      ],
      expiry: 172800,
      route_hints: [
        [
          {
            pubkey:
              '02cd1b7bc418fac2dc99f0ba350d60fa6c45fde5ab6017ee14df6425df485fb1dd',
            short_channel_id: '72edb1be53c78472',
            fee_base_msat: 1000,
            fee_proportional_millionths: 50000,
            cltv_expiry_delta: 144
          }
        ],
        [
          {
            pubkey:
              '034a7b1ac1239ff2ac8438ce0a7ade1048514b77d4322f514e96918e6c13944861',
            short_channel_id: '5db0da3400535c5a',
            fee_base_msat: 0,
            fee_proportional_millionths: 100,
            cltv_expiry_delta: 144
          }
        ]
      ]
    })
  })
})

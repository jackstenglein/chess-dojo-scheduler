import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-users')

deprecated_reqs = [
    'ed0790f6-e23c-4248-85d7-9fb319a56185',
    'bf080fe1-8f93-40cc-8719-7fcd7f19a087',
    '54c79e7e-a268-4374-a5aa-aad17bdb668e',
    'fe6cadb5-699d-4349-8244-f3e1193cf7b9',
    '30ca7f54-b799-4e70-b46b-57e40b467b7a',
    'b2115163-c4d5-487e-bd67-3aa79b3acf90',
    '76f48895-396b-4ebc-9b73-a96a3fb78151',
    '07b996bd-f72a-482b-8f44-dcd9443fc53e',
    'd1f743f7-b6d9-4ba7-a94b-5065ddf91b12',
    '1c45c7d6-9431-4bcd-a74a-e3db2e7306b0',
    '010d677f-64db-4eb0-b773-d91b20dd5acc',
    '35705ad5-0cb2-46af-8516-539842c10c8c',
    '96d26db7-2c02-4a2d-9f97-fe867dbcf061',
    'f827da04-dce5-4def-a1db-9131693befb8',
    'a9b7efac-2c4c-4439-8cf1-44edc1fff6ab',
    'dbf1f938-5818-4f74-90c7-34ce42085b0c',
]

req_map = {
    # Response to 1.e4
    'ed0790f6-e23c-4248-85d7-9fb319a56185': {
        '1100-1200': 'f784162a-3953-47ec-826f-d8c120f66e21',
        '1200-1300': 'f784162a-3953-47ec-826f-d8c120f66e21',
        '1300-1400': 'f784162a-3953-47ec-826f-d8c120f66e21',

        '1400-1500': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1500-1600': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1600-1700': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1700-1800': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',

        '1800-1900': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '1900-2000': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '2000-2100': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '2100-2200': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',

        '2200-2300': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
        '2300-2400': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
        '2400+': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
    },

    # Response to 1e4 intermediate
    '30ca7f54-b799-4e70-b46b-57e40b467b7a': {
        '1100-1200': 'f784162a-3953-47ec-826f-d8c120f66e21',
        '1200-1300': 'f784162a-3953-47ec-826f-d8c120f66e21',
        '1300-1400': 'f784162a-3953-47ec-826f-d8c120f66e21',

        '1400-1500': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1500-1600': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1600-1700': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1700-1800': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',

        '1800-1900': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '1900-2000': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '2000-2100': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '2100-2200': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',

        '2200-2300': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
        '2300-2400': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
        '2400+': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
    },

    # Response to 1e4 advanced
    'd1f743f7-b6d9-4ba7-a94b-5065ddf91b12': {
        '1100-1200': 'f784162a-3953-47ec-826f-d8c120f66e21',
        '1200-1300': 'f784162a-3953-47ec-826f-d8c120f66e21',
        '1300-1400': 'f784162a-3953-47ec-826f-d8c120f66e21',

        '1400-1500': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1500-1600': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1600-1700': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',
        '1700-1800': 'ab86d850-8335-4a3c-a87c-a018fa33fe2e',

        '1800-1900': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '1900-2000': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '2000-2100': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',
        '2100-2200': '0b8bba75-8918-4b01-b1fa-c40a18c4d08a',

        '2200-2300': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
        '2300-2400': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
        '2400+': 'a9072269-16c9-4a24-8e58-82d303b2ea53',
    },

    # Response to 1.d4
    '54c79e7e-a268-4374-a5aa-aad17bdb668e': {
        '1100-1200': '01d4568b-b4a5-4329-acbc-535385ad3d97',
        '1200-1300': '01d4568b-b4a5-4329-acbc-535385ad3d97',
        '1300-1400': '01d4568b-b4a5-4329-acbc-535385ad3d97',

        '1400-1500': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1500-1600': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1600-1700': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1700-1800': '42dbdc97-d7ba-4d54-babf-108892dfda42',

        '1800-1900': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '1900-2000': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '2000-2100': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '2100-2200': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',

        '2200-2300': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
        '2300-2400': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
        '2400+': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
    },

    # Response to 1.d4 intermediate
    '76f48895-396b-4ebc-9b73-a96a3fb78151': {
        '1100-1200': '01d4568b-b4a5-4329-acbc-535385ad3d97',
        '1200-1300': '01d4568b-b4a5-4329-acbc-535385ad3d97',
        '1300-1400': '01d4568b-b4a5-4329-acbc-535385ad3d97',

        '1400-1500': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1500-1600': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1600-1700': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1700-1800': '42dbdc97-d7ba-4d54-babf-108892dfda42',

        '1800-1900': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '1900-2000': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '2000-2100': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '2100-2200': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',

        '2200-2300': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
        '2300-2400': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
        '2400+': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
    },

    # Response to 1.d4 advanced
    '010d677f-64db-4eb0-b773-d91b20dd5acc': {
        '1100-1200': '01d4568b-b4a5-4329-acbc-535385ad3d97',
        '1200-1300': '01d4568b-b4a5-4329-acbc-535385ad3d97',
        '1300-1400': '01d4568b-b4a5-4329-acbc-535385ad3d97',

        '1400-1500': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1500-1600': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1600-1700': '42dbdc97-d7ba-4d54-babf-108892dfda42',
        '1700-1800': '42dbdc97-d7ba-4d54-babf-108892dfda42',

        '1800-1900': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '1900-2000': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '2000-2100': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',
        '2100-2200': 'e5e19253-19e8-4826-ac49-b3ec0a10258b',

        '2200-2300': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
        '2300-2400': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
        '2400+': 'e6dbed1e-577a-4316-839f-76b72c3d7df9',
    },

    # Response to 1. Nf3/c4
    'fe6cadb5-699d-4349-8244-f3e1193cf7b9': {
        '1100-1200': '872c9b34-642c-423a-bd83-f8e789a75749',
        '1200-1300': '872c9b34-642c-423a-bd83-f8e789a75749',
        '1300-1400': '872c9b34-642c-423a-bd83-f8e789a75749',

        '1400-1500': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1500-1600': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1600-1700': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1700-1800': '04a5e437-275d-4832-8625-f3eed29c2806',

        '1800-1900': '22cf5716-9644-43dd-ba8b-67e182add850',
        '1900-2000': '22cf5716-9644-43dd-ba8b-67e182add850',
        '2000-2100': '22cf5716-9644-43dd-ba8b-67e182add850',
        '2100-2200': '22cf5716-9644-43dd-ba8b-67e182add850',

        '2200-2300': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
        '2300-2400': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
        '2400+': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
    },

    # Response to 1. Nf3/c4 intermediate
    '07b996bd-f72a-482b-8f44-dcd9443fc53e': {
        '1100-1200': '872c9b34-642c-423a-bd83-f8e789a75749',
        '1200-1300': '872c9b34-642c-423a-bd83-f8e789a75749',
        '1300-1400': '872c9b34-642c-423a-bd83-f8e789a75749',

        '1400-1500': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1500-1600': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1600-1700': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1700-1800': '04a5e437-275d-4832-8625-f3eed29c2806',

        '1800-1900': '22cf5716-9644-43dd-ba8b-67e182add850',
        '1900-2000': '22cf5716-9644-43dd-ba8b-67e182add850',
        '2000-2100': '22cf5716-9644-43dd-ba8b-67e182add850',
        '2100-2200': '22cf5716-9644-43dd-ba8b-67e182add850',

        '2200-2300': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
        '2300-2400': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
        '2400+': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
    },

    # Response to 1. Nf3/c4 advanced
    '35705ad5-0cb2-46af-8516-539842c10c8c': {
        '1100-1200': '872c9b34-642c-423a-bd83-f8e789a75749',
        '1200-1300': '872c9b34-642c-423a-bd83-f8e789a75749',
        '1300-1400': '872c9b34-642c-423a-bd83-f8e789a75749',

        '1400-1500': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1500-1600': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1600-1700': '04a5e437-275d-4832-8625-f3eed29c2806',
        '1700-1800': '04a5e437-275d-4832-8625-f3eed29c2806',

        '1800-1900': '22cf5716-9644-43dd-ba8b-67e182add850',
        '1900-2000': '22cf5716-9644-43dd-ba8b-67e182add850',
        '2000-2100': '22cf5716-9644-43dd-ba8b-67e182add850',
        '2100-2200': '22cf5716-9644-43dd-ba8b-67e182add850',

        '2200-2300': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
        '2300-2400': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
        '2400+': '9e78a77f-1e45-49d2-aa56-bc5c96efcc03',
    },

    # White Repertoire
    'bf080fe1-8f93-40cc-8719-7fcd7f19a087': {
        '1100-1200': '0448d9f1-059e-42ad-9405-53f4c9c25536',
        '1200-1300': '0448d9f1-059e-42ad-9405-53f4c9c25536',
        '1300-1400': '0448d9f1-059e-42ad-9405-53f4c9c25536',

        '1400-1500': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1500-1600': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1600-1700': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1700-1800': '176887bd-3adc-4108-a197-841c9cb2eadf',

        '1800-1900': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '1900-2000': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '2000-2100': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '2100-2200': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',

        '2200-2300': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
        '2300-2400': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
        '2400+': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
    },

    # White repertoire intermediate
    'b2115163-c4d5-487e-bd67-3aa79b3acf90': {
        '1100-1200': '0448d9f1-059e-42ad-9405-53f4c9c25536',
        '1200-1300': '0448d9f1-059e-42ad-9405-53f4c9c25536',
        '1300-1400': '0448d9f1-059e-42ad-9405-53f4c9c25536',

        '1400-1500': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1500-1600': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1600-1700': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1700-1800': '176887bd-3adc-4108-a197-841c9cb2eadf',

        '1800-1900': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '1900-2000': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '2000-2100': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '2100-2200': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',

        '2200-2300': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
        '2300-2400': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
        '2400+': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
    },

    # White repertoire advanced
    '1c45c7d6-9431-4bcd-a74a-e3db2e7306b0': {
        '1100-1200': '0448d9f1-059e-42ad-9405-53f4c9c25536',
        '1200-1300': '0448d9f1-059e-42ad-9405-53f4c9c25536',
        '1300-1400': '0448d9f1-059e-42ad-9405-53f4c9c25536',

        '1400-1500': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1500-1600': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1600-1700': '176887bd-3adc-4108-a197-841c9cb2eadf',
        '1700-1800': '176887bd-3adc-4108-a197-841c9cb2eadf',

        '1800-1900': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '1900-2000': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '2000-2100': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',
        '2100-2200': 'fb761b47-7c7a-4a41-8ca3-046da00ec0b9',

        '2200-2300': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
        '2300-2400': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
        '2400+': '52ce28e4-7810-4447-8c58-f48695eaa2cc',
    },

    # vs 1.e4 Sparring
    '96d26db7-2c02-4a2d-9f97-fe867dbcf061': {
        '1100-1200': '358c06d9-4f78-482b-8eb4-e4fa7f9c6938',
        '1200-1300': '358c06d9-4f78-482b-8eb4-e4fa7f9c6938',
        '1300-1400': '358c06d9-4f78-482b-8eb4-e4fa7f9c6938',

        '1400-1500': 'a77ec6be-d8e1-4f0d-af84-64395f03c67a',
        '1500-1600': 'a77ec6be-d8e1-4f0d-af84-64395f03c67a',
        '1600-1700': 'a77ec6be-d8e1-4f0d-af84-64395f03c67a',
        '1700-1800': 'a77ec6be-d8e1-4f0d-af84-64395f03c67a',

        '1800-1900': '3c4b6fb0-edb4-4269-9034-6438ae8d81ab',
        '1900-2000': '3c4b6fb0-edb4-4269-9034-6438ae8d81ab',
        '2000-2100': '3c4b6fb0-edb4-4269-9034-6438ae8d81ab',
        '2100-2200': '3c4b6fb0-edb4-4269-9034-6438ae8d81ab',

        '2200-2300': 'e8bf2e58-8ee6-403f-b0d8-a10237656231',
        '2300-2400': 'e8bf2e58-8ee6-403f-b0d8-a10237656231',
        '2400+': 'e8bf2e58-8ee6-403f-b0d8-a10237656231',
    },

    # vs 1.d4 sparring
    'a9b7efac-2c4c-4439-8cf1-44edc1fff6ab': {
        '1100-1200': '7f83f89f-c934-4769-b134-9960a7f6423c',
        '1200-1300': '7f83f89f-c934-4769-b134-9960a7f6423c',
        '1300-1400': '7f83f89f-c934-4769-b134-9960a7f6423c',

        '1400-1500': '5f4c0dfc-a567-44c5-bd72-0dd87fe5efa0',
        '1500-1600': '5f4c0dfc-a567-44c5-bd72-0dd87fe5efa0',
        '1600-1700': '5f4c0dfc-a567-44c5-bd72-0dd87fe5efa0',
        '1700-1800': '5f4c0dfc-a567-44c5-bd72-0dd87fe5efa0',

        '1800-1900': '8ed91cc8-6eb6-408c-8ec0-1ef9f2c30b7e',
        '1900-2000': '8ed91cc8-6eb6-408c-8ec0-1ef9f2c30b7e',
        '2000-2100': '8ed91cc8-6eb6-408c-8ec0-1ef9f2c30b7e',
        '2100-2200': '8ed91cc8-6eb6-408c-8ec0-1ef9f2c30b7e',

        '2200-2300': 'f23005ed-68e4-480e-8c75-698aa0679607',
        '2300-2400': 'f23005ed-68e4-480e-8c75-698aa0679607',
        '2400+': 'f23005ed-68e4-480e-8c75-698aa0679607',
    },

    # vs 1.Nf3/c4 Sparring
    'dbf1f938-5818-4f74-90c7-34ce42085b0c': {
        '1100-1200': '9a72d6c3-d690-4f91-b7f6-0ce72d6c1c6b',
        '1200-1300': '9a72d6c3-d690-4f91-b7f6-0ce72d6c1c6b',
        '1300-1400': '9a72d6c3-d690-4f91-b7f6-0ce72d6c1c6b',

        '1400-1500': 'dda034b6-4ada-4830-b398-76814744a167',
        '1500-1600': 'dda034b6-4ada-4830-b398-76814744a167',
        '1600-1700': 'dda034b6-4ada-4830-b398-76814744a167',
        '1700-1800': 'dda034b6-4ada-4830-b398-76814744a167',

        '1800-1900': 'f69753f0-37d8-440d-8c92-612ca144b848',
        '1900-2000': 'f69753f0-37d8-440d-8c92-612ca144b848',
        '2000-2100': 'f69753f0-37d8-440d-8c92-612ca144b848',
        '2100-2200': 'f69753f0-37d8-440d-8c92-612ca144b848',

        '2200-2300': '0cc4099e-fbd1-42d4-ab99-6937eb19943e',
        '2300-2400': '0cc4099e-fbd1-42d4-ab99-6937eb19943e',
        '2400+': '0cc4099e-fbd1-42d4-ab99-6937eb19943e',
    },

    # White Repertoire Sparring
    'f827da04-dce5-4def-a1db-9131693befb8': {
        '1100-1200': 'f7d3ca03-6939-4d11-9800-15a4b99d7231',
        '1200-1300': 'f7d3ca03-6939-4d11-9800-15a4b99d7231',
        '1300-1400': 'f7d3ca03-6939-4d11-9800-15a4b99d7231',

        '1400-1500': 'ca5b352b-387e-4a53-8741-3abbb0747efc',
        '1500-1600': 'ca5b352b-387e-4a53-8741-3abbb0747efc',
        '1600-1700': 'ca5b352b-387e-4a53-8741-3abbb0747efc',
        '1700-1800': 'ca5b352b-387e-4a53-8741-3abbb0747efc',

        '1800-1900': '107a210d-a654-4013-bac5-2559e02b3a5d',
        '1900-2000': '107a210d-a654-4013-bac5-2559e02b3a5d',
        '2000-2100': '107a210d-a654-4013-bac5-2559e02b3a5d',
        '2100-2200': '107a210d-a654-4013-bac5-2559e02b3a5d',

        '2200-2300': '9853d7b2-ee59-43be-af62-03a88e65b435',
        '2300-2400': '9853d7b2-ee59-43be-af62-03a88e65b435',
        '2400+': '9853d7b2-ee59-43be-af62-03a88e65b435',
    }
}

def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            progress = user.get('progress', None)
            if progress is None or len(progress) == 0: continue

            should_update = False
            for req_id in deprecated_reqs:
                req_progress = progress.get(req_id, None)
                if req_progress is None: continue

                for cohort in req_progress['minutesSpent'].keys():
                    new_req_id = req_map[req_id].get(cohort, '')
                    if new_req_id == '':
                        continue

                    new_progress = progress.get(new_req_id, {
                        'requirementId': new_req_id,
                        'counts': {},
                        'minutesSpent': {},
                        'updatedAt': req_progress['updatedAt'],
                    })

                    new_progress['minutesSpent'][cohort] = new_progress['minutesSpent'].get(cohort, 0) + req_progress['minutesSpent'].get(cohort, 0)
                    new_progress['counts'][cohort] = new_progress['minutesSpent'][cohort]
                    if req_progress['updatedAt'] > new_progress['updatedAt']:
                        new_progress['updatedAt'] = req_progress['updatedAt']

                    progress[new_req_id] = new_progress
                    should_update = True

            if should_update:
                user['progress'] = progress
                batch.put_item(Item=user)
                updated += 1

    return updated


def main():
    updated = 0

    try:
        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        updated += update_users(items)

        while lastKey != None:
            print(lastKey)
            res = table.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])
            updated += update_users(items)

    except Exception as e:
        print(e)

    print("Updated: ", updated)

if __name__ == '__main__':
    main()

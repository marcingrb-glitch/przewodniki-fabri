-- =============================================
-- DATABASE BACKUP - 2026-03-09
-- All key tables exported as INSERT statements
-- =============================================

-- ============ SERIES ============
INSERT INTO series (id, code, name, collection, created_at) VALUES
  ('d0cf31a4-07cc-4245-b0bc-45b5811e1eb8', 'S1', 'Sofa Mar', 'Viena', '2026-02-08 09:52:23.486125+00'),
  ('1003fb17-1719-43d3-8d1f-18bdd8008484', 'S2', 'Sofa Elma', 'M+R+P+B+S', '2026-02-08 09:52:23.486125+00')
ON CONFLICT (id) DO NOTHING;

-- ============ FINISHES ============
INSERT INTO finishes (id, code, name, created_at) VALUES
  ('73c5815e-caeb-4a54-ab41-575585a342b6', 'A', 'Stebnówka', '2026-02-08 09:53:33.854105+00'),
  ('efdb879a-55dd-40c9-b789-1dbc877f0c76', 'B', 'Szczypanka', '2026-02-08 09:53:33.854105+00'),
  ('f49e5322-7d32-4084-9548-7e961b772f34', 'C', 'Dwuigłówka', '2026-02-08 09:53:33.854105+00'),
  ('99917406-eb35-41cf-abe3-c4bc57df0b03', 'D', 'Zwykły', '2026-02-08 09:53:33.854105+00')
ON CONFLICT (id) DO NOTHING;

-- ============ CHESTS ============
INSERT INTO chests (id, code, name, leg_height_cm, created_at) VALUES
  ('57cb7bed-449b-4402-a22d-2b5382aa0497', 'SK15', 'SK15 - 190', 10, '2026-02-08 09:53:33.854105+00'),
  ('f6187c0c-34ed-409d-9c5e-bb2631acdda4', 'SK17', 'SK17 - 190', 8, '2026-02-08 09:53:33.854105+00'),
  ('0e19ae7b-6406-4c76-9b1f-31d4d34272a9', 'SK23', 'SK23 - 190', 2.5, '2026-02-08 09:53:33.854105+00')
ON CONFLICT (id) DO NOTHING;

-- ============ PILLOWS ============
INSERT INTO pillows (id, code, name, allowed_finishes, default_finish, created_at) VALUES
  ('cf26f68e-0b1d-4189-8359-f5b3c03b2dfa', 'P1', 'Poduszka kwadratowa', ARRAY['A','B'], NULL, '2026-02-08 09:53:33.854105+00'),
  ('d4d55050-83d0-4c8c-a3e2-37ca9d3a50cb', 'P2', 'Poduszka zaokrąglona', ARRAY['B','C'], NULL, '2026-02-08 09:53:33.854105+00'),
  ('b885a7f7-45c3-420b-a43b-2bbe51eb4ff3', 'P3', 'Poduszka kwadratowa z zaokrąglonym bodnem', ARRAY['A'], 'A', '2026-02-16 05:30:28.933641+00')
ON CONFLICT (id) DO NOTHING;

-- ============ JASKIS ============
INSERT INTO jaskis (id, code, name, created_at) VALUES
  ('82151601-67ae-4270-8497-1191030bc384', 'J1', 'Jasiek kwadratowy', '2026-02-08 09:53:33.854105+00'),
  ('9070dbad-a358-4e69-97d0-e4fb95b5b0bb', 'J2', 'Jasiek zaokrąglony', '2026-02-08 09:53:33.854105+00'),
  ('cadb810a-5145-487c-9925-6002506e2bac', 'J3', 'Poduszka kwadratowa z zaokrąglonym bodnem', '2026-02-16 05:30:42.592263+00'),
  ('6521370b-c41c-46e8-9ac5-dcdd6fd78da8', 'J4', 'Jasiek okrągły', '2026-03-02 12:51:03.813925+00')
ON CONFLICT (id) DO NOTHING;

-- ============ WALEKS ============
INSERT INTO waleks (id, code, name, created_at) VALUES
  ('cd3f0628-f72a-4178-83bb-d7ed22f5da00', 'W1', 'Wałek', '2026-02-08 09:53:33.854105+00')
ON CONFLICT (id) DO NOTHING;

-- ============ FABRICS ============
INSERT INTO fabrics (id, code, name, price_group, colors, created_at) VALUES
  ('7dedbac5-62ea-44ce-a1cc-3f515935f6f1', 'T1', 'Guilty', 1, '[{"code":"A","name":"Sand"},{"code":"B","name":"Cement"},{"code":"C","name":"Pearl"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('7c0ac986-5670-45a3-984d-c6ffcea8e024', 'T2', 'Portland', 1, '[{"code":"A","name":"Cream"},{"code":"B","name":"Ash"},{"code":"C","name":"Moss"},{"code":"D","name":"Taupe"},{"code":"E","name":"Rust"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('e809e2e8-5dd7-45e4-b9ef-7d4de2012a10', 'T3', 'Cloud', 1, '[{"code":"A","name":"3"},{"code":"B","name":"39"},{"code":"C","name":"79"},{"code":"D","name":"83"},{"code":"E","name":"91"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('7afc694a-c523-4f88-9192-66ea7f9484e7', 'T4', 'Tribue', 2, '[{"code":"A","name":"Ivory"},{"code":"B","name":"Fog"},{"code":"C","name":"Green"},{"code":"D","name":"Pearl"},{"code":"E","name":"Toffee"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('17a92424-0b3b-4275-a7b6-62dbff7eddfa', 'T5', 'Brooklyn', 2, '[{"code":"A","name":"Pearl"},{"code":"B","name":"Beige"},{"code":"C","name":"Mud"},{"code":"D","name":"Fog"},{"code":"E","name":"Cement"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('64df8a30-0da6-424a-9b2a-6145a694428d', 'T6', 'Bronx', 2, '[{"code":"A","name":"Camel"},{"code":"B","name":"Beige"},{"code":"C","name":"Light Grey"},{"code":"D","name":"Taupe"},{"code":"E","name":"Ocean"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('7fd22803-4ace-49c5-8176-d19168245eb1', 'T7', 'Casino', 2, '[{"code":"A","name":"Sand"},{"code":"B","name":"Deep Green"},{"code":"C","name":"Fog"},{"code":"D","name":"Pearl"},{"code":"E","name":"Terracotta"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('6916c671-b87a-49cb-a8ba-85463dd3055b', 'T8', 'Seattle', 3, '[{"code":"A","name":"Sand"},{"code":"B","name":"Toffee"},{"code":"C","name":"Cream"},{"code":"D","name":"Camel"},{"code":"E","name":"Light Grey"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('7c22124a-ec65-4e4f-8ebc-cb0a3ae104ad', 'T9', 'Macau', 3, '[{"code":"A","name":"Sand"},{"code":"B","name":"Gold"},{"code":"C","name":"Ash"},{"code":"D","name":"Pearl"},{"code":"E","name":"Forrest"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('03434450-6a47-4ac0-953d-2e272739ca2d', 'T10', 'Puente', 1, '[{"code":"A","name":"06"},{"code":"B","name":"3"},{"code":"C","name":"80"},{"code":"D","name":"92"},{"code":"E","name":"37"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('441abe8f-b174-4517-bb85-9f7dceae4f41', 'T11', 'Legend Natural - Ascot', 3, '[{"code":"A","name":"Pearl"},{"code":"B","name":"Cream/Nata"},{"code":"C","name":"Taupe/Toffee"},{"code":"D","name":"Deep Terra/Brick"},{"code":"E","name":"Grey/Taupe"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('f28aba7d-705e-4f5b-8f00-f672a7bb5af5', 'T12', 'Bliss', 3, '[{"code":"A","name":"Cream"},{"code":"B","name":"Sand"},{"code":"C","name":"Fog"},{"code":"D","name":"Khaki"},{"code":"E","name":"Stone"}]'::jsonb, '2026-02-08 09:52:58.156598+00'),
  ('15756838-0b5e-486a-a9e4-aec6ba1a95ce', 'T13', 'Zoom 1', 1, '[{"code":"A","name":"Cream"},{"code":"B","name":"Mink"},{"code":"C","name":"Toffee"},{"code":"D","name":"Winter Moss"},{"code":"E","name":"Dove"},{"code":"F","name":"Ash"}]'::jsonb, '2026-02-08 09:52:58.156598+00')
ON CONFLICT (id) DO NOTHING;

-- ============ AUTOMATS ============
INSERT INTO automats (id, code, name, type, has_seat_legs, seat_leg_count, seat_leg_height_cm, series_id, created_at) VALUES
  ('3003aa30-ba20-4e7c-b891-b5645b4da397', 'AT1', 'Zwykły', 'Automat zwykły', true, 2, 15, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:53:33.854105+00'),
  ('78ad6cbd-108b-4136-8e1d-521da26db338', 'AT2', 'Wyrzutkowy', 'Automat z nóżką', false, 0, 0, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:53:33.854105+00'),
  ('b022bcf1-a857-4419-b9f0-9e3619420268', 'AT1', 'Zwykły', 'Automat zwykły', true, 2, 2.5, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-03-02 20:12:52.831868+00')
ON CONFLICT (id) DO NOTHING;

-- ============ LEGS ============
INSERT INTO legs (id, code, name, material, colors, series_id, created_at) VALUES
  ('1086aac9-c663-4ea2-8900-5412cb6eeaa3', 'N1', 'Stożek prosty', 'Drewniany', '[{"code":"A","name":"Buk"},{"code":"B","name":"Brązowa"},{"code":"C","name":"Czarna"}]'::jsonb, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('b11b1b1a-96c5-4f71-89ab-beb239a996b1', 'N2', 'Stożek skos', 'Drewniany', '[{"code":"A","name":"Buk"},{"code":"B","name":"Brązowa"},{"code":"C","name":"Czarna"}]'::jsonb, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('f99a68d6-564e-4ede-a4e8-ad846a16f8fc', 'N3', 'Walec', 'Drewniany', '[{"code":"A","name":"Buk"},{"code":"B","name":"Brązowa"},{"code":"C","name":"Czarna"}]'::jsonb, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('ca4d4140-4d3c-4902-93df-1b6c31376469', 'N4', 'Plastikowa', 'Plastik', '[]'::jsonb, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('3047fa7c-6485-497a-b741-56ae718ecaaa', 'N4', 'Nóżka plastikowa 2,5 cm z gwintem M5', 'Czarny plastik', '[]'::jsonb, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:51:41.251409+00'),
  ('6d0eaaa1-6958-4eb3-a299-2b26c5b4e998', 'N5', 'Szpilka', 'Metalowa', '[{"code":"A","name":"Czarna"},{"code":"B","name":"Złota"}]'::jsonb, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00')
ON CONFLICT (id) DO NOTHING;

-- ============ EXTRAS ============
INSERT INTO extras (id, code, name, type, series_id, created_at) VALUES
  ('acf12f27-f368-46be-9ea0-6593a5174313', 'PF', 'Pufa normalna', 'pufa', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('88f8d734-48b4-4547-8552-d92cc0be8b1b', 'PFO', 'Pufa otwierana', 'pufa', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('3954cc90-e264-4b35-aa11-424690dd3a15', 'FT', 'Fotel', 'fotel', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00')
ON CONFLICT (id) DO NOTHING;

-- ============ BACKRESTS ============
INSERT INTO backrests (id, code, height_cm, frame, foam, top, allowed_finishes, default_finish, series_id, created_at) VALUES
  ('af3b06e9-e654-41ad-9bed-ba533cabf32e', 'OP62', '62', 'S1-OP62-190', '62.5 x 190 x 9 VPPT 30-40 [Viena]', '', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('6ab3420b-ff9c-4d9d-b006-c8e38a7988dc', 'OP68', '68', 'S1-OP68-190', '68 x 190 x 9 VPPT 30-40 [Viena]', '', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('3e8537fe-1b0d-45fb-8b77-6326e01c492b', 'OP68', '68', 'OP68 [Rama na płasko]', '9 x 68,5 x 190 [cm] PIONER', NULL, ARRAY['A'], 'A', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:47:31.066472+00')
ON CONFLICT (id) DO NOTHING;

-- ============ SIDES ============
INSERT INTO sides (id, code, name, frame, allowed_finishes, default_finish, series_id, created_at) VALUES
  ('6a5f674d-33b9-4ce3-adaf-f53a0f5b6e6e', 'B1', 'Roland', 'B1 [Roland]', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('67b5199a-1291-429e-a931-7372a890809d', 'B2', 'Arte', 'B2 [Arte]', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('4490d609-3b67-44f6-9a22-96d43715572e', 'B3', 'Urano', 'B3 [Urano]', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('65b10c4c-03c2-4871-bcf0-1dedf10c6bf0', 'B4', 'Nord', 'B4 [Nord]', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('dc227c57-7b24-4c72-8650-7e88c03cd199', 'B5', 'Herford', 'B5 [Herford]', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('39949669-868c-43cf-a46b-b53f13cb62f3', 'B6', 'Iga A', 'B6/B8 [Iga\Vamos]', ARRAY['A','B','C'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('01d84f49-0085-44b5-8bd6-d82c664208db', 'B6s', 'Iga A Szeroka', 'B6/B8 [Iga\Vamos]', ARRAY['A','B','C'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-09 11:53:25.75233+00'),
  ('07bfeae5-4dff-4676-9ade-3bb94a76de19', 'B6w', 'Iga A Wąska', 'B10 [Iga\Vamos Cienka]', ARRAY['A','B','C'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-09 11:54:12.973661+00'),
  ('0c814b12-1029-4cc5-8b5d-37d0ecfaf08f', 'B7', 'Iga B', 'B7 [Iga I]', ARRAY['A','B','C'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('e7fe23bc-b838-4ea3-90f2-d3930162fb1e', 'B8', 'Iga C', 'B6/B8 [Iga\Vamos]', ARRAY['A','B','C'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('572968f9-3840-4439-946f-9aea45774de8', 'B9', 'Viena', 'B9 [Viena]', ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('a3bd5f27-de26-41a5-ad84-ddbef22781dd', 'B1', 'Modena 9', 'B1 [Modena 9]', ARRAY['B','C'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:48:33.038052+00'),
  ('3bea554f-9386-4fe5-a8c6-7faf721f86a0', 'B2', 'Modena II', 'B2 [Modena 15]', ARRAY['B','C'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:48:36.060841+00'),
  ('d5efcbc1-c3d8-4acc-84c4-9a985af6ee16', 'B3', 'Ravena', 'B3 [Ravena]', ARRAY['A'], 'A', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:49:52.223057+00'),
  ('70167ccc-701d-47dd-855f-c61f20e85e08', 'B4', 'Sienna', 'B4 [Sienna]', ARRAY['B','C'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:50:08.381089+00'),
  ('c768bc34-1748-4eab-9da7-f5b08f1d6f66', 'B5', 'Porto', 'B5 [Porto]', ARRAY['A','B'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:50:21.089979+00'),
  ('3e319cee-3ef5-44ca-9da1-ddd35becf857', 'B6', 'Barga', 'B6 [Barga]', ARRAY['A','B'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:50:38.381823+00')
ON CONFLICT (id) DO NOTHING;

-- ============ SEATS_SOFA ============
INSERT INTO seats_sofa (id, code, type, type_name, frame, foam, front, center_strip, allowed_finishes, default_finish, series_id, created_at) VALUES
  ('2b5269bc-63bb-43a6-b8a2-4ea68450a926', 'SD01N', 'Niskie', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', '17 x 190 x 2 VP30 [Viena]', true, ARRAY['A'], 'A', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('a9331825-73a7-4dad-b4f1-7a4a1e8e77c5', 'SD01ND', 'Niskie dzielone', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', '17 x 190 x 2 VP30 [Viena]', true, ARRAY['A'], 'A', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('f73d7b50-85b0-41ca-82ab-d9e4b2955be1', 'SD01W', 'Wysokie', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', '23 x 190 x 2 VP30', true, ARRAY['A'], 'A', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('b89e4d53-fb9e-430c-9bb0-e2060e51ced4', 'SD02N', 'Niskie', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', 'Półwałek SD02N', true, ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('72069be0-2cb9-4e29-aded-7780847994ca', 'SD02ND', 'Niskie dzielone', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', 'Półwałek SD02N', true, ARRAY['A'], 'A', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('09d11eb2-c539-42ab-9388-81207e60ab03', 'SD02W', 'Wysokie', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', 'Półwałek SD02W', true, ARRAY['A'], 'A', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('107fc377-5805-4997-89f0-41225cf9e47f', 'SD03', 'Standardowe', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', '17 x 190 x 2 VP30 [Viena]', false, ARRAY['A','B'], NULL, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('3ba07d46-378e-46c9-91c2-3033a23f6849', 'SD04', 'Standardowe', NULL, 'S1-SD-190 [Viena]', '78 x 190 x 9 VPPT 30-40 [Viena]', 'Półwałek SD04', false, ARRAY['D'], 'D', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('c66f4fe8-e509-4df8-870b-8aa0c253a16d', 'SD1', 'Całe do ziemi', NULL, 'Modena / Ravenna / Sienna', '6 x 78,5 x 190 [cm] + 3 x 118 x 190 [cm] PIONIER', 'Półwałek Modena + Ćwierćwałek boki', false, ARRAY['D'], 'D', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:31:59.747376+00'),
  ('3b49f96c-25b3-49a9-b90b-e097771c8552', 'SD2', 'Całe do ziemi', NULL, 'Modena / Ravenna / Sienna', '6 x 78,5 x 190 [cm] + 3 x 118 x 190 [cm] PIONIER', 'Półwałek Modena + Ćwierćwałek boki', false, ARRAY['A'], 'A', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:43:09.890293+00'),
  ('5c4297ad-ea14-4ca1-81ec-a4b3b4479c52', 'SD2D', 'Całe do ziemi + dzielone', NULL, 'Modena / Ravenna / Sienna', '6 x 78,5 x 190 [cm] + 3 x 118 x 190 [cm] PIONIER', 'Półwałek Modena + Ćwierćwałek boki', true, ARRAY['A'], 'A', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:43:45.201655+00'),
  ('2605c410-c334-46b2-9d25-a326a3966c95', 'SD3', 'Całe do ziemi', NULL, 'Modena / Ravenna / Sienna', '6 x 78,5 x 190 [cm] + 3 x 118 x 190 [cm] PIONIER', 'Półwałek Modena', false, ARRAY['A'], 'A', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:44:04.845169+00'),
  ('4af9e557-335a-4ca6-a6dc-41236f80111c', 'SD3D', 'Całe do ziemi + dzielone', NULL, 'Modena / Ravenna / Sienna', '6 x 78,5 x 190 [cm] + 3 x 118 x 190 [cm] PIONIER', 'Półwałek Modena', true, ARRAY['A'], 'A', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:44:21.234798+00'),
  ('82f8716a-5a88-4fd5-b468-d80d8b4d5e3c', 'SD4', 'Całe do ziemi', NULL, 'Porto', '9 x 80,5 x 190 [cm] PIONIER', 'Pasek Porto 2,5 [cm]', false, ARRAY['A','B'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:44:39.738124+00'),
  ('10c9e3c5-d7e4-4c8f-bf3a-8a2e8c7d9f1a', 'SD4B', 'Całe do ziemi', NULL, 'Porto', '9 x 80,5 x 190 [cm] PIONIER', 'Pasek Porto 2,5 [cm]', false, ARRAY['A','B'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:45:33.446223+00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SD4D', 'Całe do ziemi + dzielone', NULL, 'Porto', '9 x 80,5 x 190 [cm] PIONIER', 'Pasek Porto 2,5 [cm]', true, ARRAY['A','B'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:45:33.446223+00'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'SD5', 'Całe do ziemi', NULL, 'Barga', '9 x 80,5 x 190 [cm] PIONIER', 'Pasek Barga 2,5 [cm]', false, ARRAY['A','B'], NULL, '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-02-16 05:46:05.446223+00')
ON CONFLICT (id) DO NOTHING;

-- ============ SEATS_PUFA ============
INSERT INTO seats_pufa (id, code, front_back, sides, base_foam, box_height, series_id, created_at) VALUES
  ('97238819-fa62-41ac-a19a-b8b8793ea615', 'SD01N', '17 x 63 x 1', '17 x 63 x 1', '16 x 62 x 62', '13 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('d1769f8e-d303-40a2-b5d1-4cb56ee8f824', 'SD01ND', '17 x 63 x 1', '17 x 63 x 1', '16 x 62 x 62', '13 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('7747818d-ee82-424a-aba9-78814376d102', 'SD01W', '23 x 63 x 1', '23 x 63 x 1', '18 x 62 x 62', '8 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('aae1baa1-7ada-40c5-8c86-bb2b33587481', 'SD02N', 'Półwałek SD02N', '17 x 63 x 1', '16 x 62 x 62', '13 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('18d8264e-a255-4d96-aa57-6d56fab3349f', 'SD02ND', 'Półwałek SD02N', '17 x 63 x 1', '16 x 62 x 62', '13 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('7aa3b573-af77-483e-a4ca-c6f1ae82cffb', 'SD02W', 'Półwałek SD02W', '23 x 63 x 1', '18 x 62 x 62', '8 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('616b35f6-63a6-4a6b-816c-b6287fab2842', 'SD03', '17 x 63 x 1', '17 x 63 x 1', '16 x 62 x 62', '13 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00'),
  ('782bbc02-37f8-469f-8c12-22cdba4dbcc9', 'SD04', 'Półwałek SD04', 'Półwałek SD04', '16 x 62 x 62', '13 cm', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-02-08 09:54:45.751065+00')
ON CONFLICT (id) DO NOTHING;

-- ============ SKU_PARSE_RULES ============
INSERT INTO sku_parse_rules (id, component_type, zero_padded, code_format, notes, series_id, created_at) VALUES
  ('399cd69c-d282-449a-bff0-60ebfd04ab3b', 'seat', true, NULL, 'S1: SD01N, SD02ND - kody z zerem wiodącym', 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-03-02 15:13:55.724062+00'),
  ('544d9bbd-caf8-45ff-a77e-b543569a7142', 'seat', false, NULL, 'S2: SD1, SD1D, SD4B - kompaktowe kody bez zera', '1003fb17-1719-43d3-8d1f-18bdd8008484', '2026-03-02 15:13:55.724062+00')
ON CONFLICT (id) DO NOTHING;

-- ============ SIDE_EXCEPTIONS ============
INSERT INTO side_exceptions (id, original_code, mapped_code, description, active, series_id, created_at) VALUES
  ('a8cb1311-6b8e-40a9-8749-6592a6503811', 'B6D', 'B6C', 'Wyjątek legacy Shopify - boczek Iga A', true, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-03-02 15:13:55.724062+00'),
  ('0a676446-097a-4e25-8396-aebaf4f66289', 'B6WD', 'B6WC', 'Wyjątek legacy Shopify - boczek Iga A Wąska', true, 'd0cf31a4-07cc-4245-b0bc-45b5811e1eb8', '2026-03-02 15:13:55.724062+00')
ON CONFLICT (id) DO NOTHING;

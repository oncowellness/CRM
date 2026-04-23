-- ═══════════════════════════════════════════════════════════════
--  Oncowellness CRM — Datos demo
--  Crea una clínica demo, un usuario admin y los datos mock
--  Ejecutar DESPUÉS de las migraciones
-- ═══════════════════════════════════════════════════════════════

-- ── Clínica demo ──────────────────────────────────────────────────────────────
INSERT INTO clinics (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Oncowellness Demo', 'oncowellness-demo')
ON CONFLICT (slug) DO NOTHING;

-- ── Programas base ────────────────────────────────────────────────────────────
INSERT INTO programs (code, clinic_id, type, name, description, sessions, duration) VALUES
  ('FX-01', '00000000-0000-0000-0000-000000000001', 'FX', 'Fisioterapia Oncológica Básica', 'Programa base de rehabilitación funcional oncológica', 12, '6 semanas'),
  ('FX-02', '00000000-0000-0000-0000-000000000001', 'FX', 'Ejercicio Terapéutico Avanzado', 'Ejercicio de alta intensidad supervisado', 16, '8 semanas'),
  ('FX-03', '00000000-0000-0000-0000-000000000001', 'FX', 'Linfedema y Cicatriz', 'Manejo del linfedema y cicatriz post-quirúrgica', 10, '5 semanas'),
  ('FX-04', '00000000-0000-0000-0000-000000000001', 'FX', 'Activación Transverso Abdominal', 'Estabilización del core oncológico', 8, '4 semanas'),
  ('FX-05', '00000000-0000-0000-0000-000000000001', 'FX', 'Equilibrio y Prevención de Caídas', 'Entrenamiento propioceptivo y de equilibrio', 10, '5 semanas'),
  ('PS-01', '00000000-0000-0000-0000-000000000001', 'PS', 'Intervención en Crisis', 'Protocolo de intervención psicológica urgente', 1, 'Puntual'),
  ('PS-02', '00000000-0000-0000-0000-000000000001', 'PS', 'Psico-oncología Básica', 'Apoyo psicológico adaptado a paciente oncológico', 8, '8 semanas'),
  ('PS-03', '00000000-0000-0000-0000-000000000001', 'PS', 'MBSR - Reducción Estrés', 'Mindfulness-Based Stress Reduction adaptado', 8, '8 semanas'),
  ('NU-01', '00000000-0000-0000-0000-000000000001', 'NU', 'Nutrición Oncológica Básica', 'Plan nutricional durante tratamiento activo', 4, '4 semanas'),
  ('NU-02', '00000000-0000-0000-0000-000000000001', 'NU', 'Control de Peso Post-Tratamiento', 'Seguimiento nutricional en supervivencia', 6, '6 semanas'),
  ('EO-01', '00000000-0000-0000-0000-000000000001', 'EO', 'Cuidado de Piel y Mucosas', 'Protocolo estética oncológica durante tratamiento', 4, '4 semanas'),
  ('EO-02', '00000000-0000-0000-0000-000000000001', 'EO', 'Bienestar Integral', 'Imagen corporal y autoestima', 4, '4 semanas'),
  ('TS-01', '00000000-0000-0000-0000-000000000001', 'TS', 'Recursos Socioeconómicos', 'Gestión de ayudas, bajas, recursos sociales', 2, '2 semanas')
ON CONFLICT DO NOTHING;

-- ── Bundles ───────────────────────────────────────────────────────────────────
INSERT INTO bundles (code, clinic_id, name, phase, description, programs) VALUES
  ('PC-01', '00000000-0000-0000-0000-000000000001', 'Pack Diagnóstico', 'F1', 'Evaluación inicial completa al diagnóstico', ARRAY['FX-01','PS-02','NU-01']),
  ('PC-02', '00000000-0000-0000-0000-000000000001', 'Pack Prehab', 'F2', 'Preparación preoperatoria/pre-tratamiento', ARRAY['FX-01','FX-02','NU-01','PS-02']),
  ('PC-03', '00000000-0000-0000-0000-000000000001', 'Pack Tratamiento Activo', 'F3', 'Soporte durante quimio/radio/cirugía', ARRAY['FX-01','PS-01','PS-02','EO-01','NU-01']),
  ('PC-04', '00000000-0000-0000-0000-000000000001', 'Pack Supervivencia', 'F6', 'Programa de supervivencia a largo plazo', ARRAY['FX-02','PS-03','NU-02','EO-02']),
  ('PC-05', '00000000-0000-0000-0000-000000000001', 'Pack Cuidados Avanzados', 'F8', 'Soporte paliativo integral', ARRAY['PS-01','PS-02','TS-01'])
ON CONFLICT DO NOTHING;

-- ── Paciente demo ─────────────────────────────────────────────────────────────
-- NOTA: Crear primero el usuario en Supabase Auth y reemplazar el UUID aquí
-- supabase: Authentication → Users → Invite user → copiar UUID

-- INSERT INTO patients (id, clinic_id, name, age, gender, email, current_phase, mind_state, alert_status, assigned_programs)
-- VALUES (
--   'P001-uuid-aqui',
--   '00000000-0000-0000-0000-000000000001',
--   'María García López', 52, 'F', 'mgarcia@email.com', 'F3', 'Ansioso', 'amarillo',
--   ARRAY['FX-01','PS-02','NU-01']
-- );

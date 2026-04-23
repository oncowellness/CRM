-- ═══════════════════════════════════════════════════════════════
--  Oncowellness CRM — Row Level Security (RLS)
--  Garantiza aislamiento por clínica y control por roles
-- ═══════════════════════════════════════════════════════════════

-- ── Helper: obtener clinic_id del usuario autenticado ────────────────────────
CREATE OR REPLACE FUNCTION auth_clinic_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$;

-- ── Activar RLS en todas las tablas ──────────────────────────────────────────
ALTER TABLE clinics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE handgrip_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE six_mwt_measurements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE thirty_sts_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tug_measurements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transverso_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_measurements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE phq9_assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gad7_assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE facitf_assessments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE eortc_assessments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_content    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;

-- ── Clínicas: solo ves la tuya ────────────────────────────────────────────────
CREATE POLICY clinics_isolation ON clinics
  FOR ALL USING (id = auth_clinic_id());

-- ── Perfiles: solo ves los de tu clínica ─────────────────────────────────────
CREATE POLICY profiles_isolation ON user_profiles
  FOR ALL USING (clinic_id = auth_clinic_id());

-- ── Programas y Bundles ───────────────────────────────────────────────────────
CREATE POLICY programs_isolation ON programs
  FOR ALL USING (clinic_id = auth_clinic_id());

CREATE POLICY bundles_isolation ON bundles
  FOR ALL USING (clinic_id = auth_clinic_id());

-- Solo admin puede insertar/actualizar programas y bundles
CREATE POLICY programs_write ON programs
  FOR INSERT WITH CHECK (clinic_id = auth_clinic_id() AND auth_role() IN ('admin','clinician'));

CREATE POLICY bundles_write ON bundles
  FOR INSERT WITH CHECK (clinic_id = auth_clinic_id() AND auth_role() IN ('admin','clinician'));

-- ── Pacientes: aislados por clínica, readers solo leen ───────────────────────
CREATE POLICY patients_read ON patients
  FOR SELECT USING (clinic_id = auth_clinic_id());

CREATE POLICY patients_write ON patients
  FOR INSERT WITH CHECK (clinic_id = auth_clinic_id() AND auth_role() IN ('admin','clinician'));

CREATE POLICY patients_update ON patients
  FOR UPDATE USING (clinic_id = auth_clinic_id())
  WITH CHECK (auth_role() IN ('admin','clinician'));

CREATE POLICY patients_delete ON patients
  FOR DELETE USING (clinic_id = auth_clinic_id() AND auth_role() = 'admin');

-- ── Mediciones: acceso a través de pacientes de la misma clínica ──────────────
-- (Macro para tablas de mediciones — repite para cada tabla)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'handgrip_measurements','six_mwt_measurements','thirty_sts_measurements',
    'tug_measurements','transverso_measurements','balance_measurements',
    'phq9_assessments','gad7_assessments','facitf_assessments','eortc_assessments',
    'sessions','crisis_orders','clinical_notes','patient_content'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I_read ON %I FOR SELECT
         USING (patient_id IN (SELECT id FROM patients WHERE clinic_id = auth_clinic_id()));
       CREATE POLICY %I_write ON %I FOR INSERT
         WITH CHECK (patient_id IN (SELECT id FROM patients WHERE clinic_id = auth_clinic_id())
           AND auth_role() IN (''admin'',''clinician''));
       CREATE POLICY %I_update ON %I FOR UPDATE
         USING (patient_id IN (SELECT id FROM patients WHERE clinic_id = auth_clinic_id()))
         WITH CHECK (auth_role() IN (''admin'',''clinician''));',
      tbl||'_read',  tbl,
      tbl||'_write', tbl,
      tbl||'_update',tbl
    );
  END LOOP;
END $$;

-- ── Audit log: solo lectura para admins ───────────────────────────────────────
CREATE POLICY audit_read ON audit_log
  FOR SELECT USING (clinic_id = auth_clinic_id() AND auth_role() = 'admin');

-- ── Trigger: auto-registrar cambios en audit_log ─────────────────────────────
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (user_id, clinic_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    auth_clinic_id(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Activar audit en tablas sensibles
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['patients','phq9_assessments','crisis_orders','clinical_notes'] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();',
      'audit_'||tbl, tbl
    );
  END LOOP;
END $$;

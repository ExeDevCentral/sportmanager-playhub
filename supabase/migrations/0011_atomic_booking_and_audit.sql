-- 0011_atomic_booking_and_audit.sql
-- Previene doble reserva simultánea en la misma cancha y horario, y expira señas vencidas.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_no_overlap;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));

-- Reserva atómica: falla con excepción SQLSTATE 23P01 si existe solapamiento.
CREATE OR REPLACE FUNCTION book_reservation(
  p_complex_id uuid,
  p_court_id uuid,
  p_customer_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_price numeric,
  p_deposit_amount numeric DEFAULT 0,
  p_channel text DEFAULT 'online',
  p_status text DEFAULT 'pending',
  p_expires_at timestamptz DEFAULT (now() + interval '15 minutes')
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO reservations (
    complex_id,
    court_id,
    customer_id,
    starts_at,
    ends_at,
    price,
    deposit_amount,
    channel,
    status,
    expires_at
  )
  VALUES (
    p_complex_id,
    p_court_id,
    p_customer_id,
    p_starts_at,
    p_ends_at,
    p_price,
    p_deposit_amount,
    p_channel::reservation_channel,
    p_status::reservation_status,
    CASE WHEN p_status = 'pending' THEN p_expires_at ELSE NULL END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Libera automáticamente reservas pendientes cuya seña expiró.
CREATE OR REPLACE FUNCTION expire_pending_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE reservations
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancel_reason = 'Seña expirada automáticamente'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

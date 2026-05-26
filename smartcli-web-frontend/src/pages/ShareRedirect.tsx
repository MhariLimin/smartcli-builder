import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { decode } from '../lib/shareLink';

// Renders nothing visible — its only job is to decode the `/c/:payload`
// segment and redirect into the Builder with the right seed (or surface an
// error via the `?share_error=...` query param the Builder page reads).
export function ShareRedirect() {
  const { payload } = useParams<{ payload: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const decoded = payload ? decode(payload) : null;
    if (!decoded) {
      navigate('/?share_error=invalid', { replace: true });
      return;
    }
    const qs = new URLSearchParams();
    qs.set('template', decoded.cmd);
    if (decoded.cat) qs.set('category', decoded.cat);
    navigate('/?' + qs.toString(), { replace: true });
  }, [payload, navigate]);

  return null;
}

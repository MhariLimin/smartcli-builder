import { useNavigate } from 'react-router-dom';
import { CatalogView } from '../components/CatalogView';

// CatalogView is unchanged — this page just adapts its "Use" callback into
// a navigate('/?template=…&category=…') so the Builder picks up the seed
// from the query string. That keeps the handoff deep-linkable instead of
// hidden in React state.
export function CatalogPage() {
  const navigate = useNavigate();
  const onUseTemplate = (template: string, category: string) => {
    const params = new URLSearchParams();
    params.set('template', template);
    if (category) params.set('category', category);
    navigate('/?' + params.toString());
  };
  return <CatalogView onUseTemplate={onUseTemplate} />;
}

import { useNavigate } from 'react-router-dom';
import { CatalogView } from '../components/CatalogView';

export function CatalogPage() {
  const navigate = useNavigate();

  const onUseTemplate = (template: string, category: string) => {
    const params = new URLSearchParams();
    params.set('template', template);
    if (category) params.set('category', category);
    navigate('/builder?' + params.toString());
  };

  return <CatalogView onUseTemplate={onUseTemplate} />;
}

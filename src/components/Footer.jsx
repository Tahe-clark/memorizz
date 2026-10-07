import { useI18n } from '../i18n/context';

export default function Footer() {
    const { t } = useI18n();
    return (
        <footer className="site-footer">
            <div className="container">{t('footer.by')}</div>
        </footer>
    );
}

import Beranda from '../pages/beranda.f7';
import Transaksi from '../pages/tugas.f7';
import Tentang from '../pages/tentang.f7';
import Home from '../pages/home.f7';

var routes = [
    {
        path: '/',
        component: Home,
        tabs: [
            {path: '/', id: 'view-beranda', component: Beranda},
            {path: '/tugas/', id: 'view-tugas', component: Transaksi},
            {path: '/tentang/', id: 'view-tentang', component: Tentang}
        ]
    },
];

export default routes;
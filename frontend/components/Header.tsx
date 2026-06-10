
interface Items{ 
    label: string;
    url: string;
}

export const Header = ()=> { 
    const ITEMS: Items[]= [
        { 
            label: "Escanear",
            url: "/"
        },
        { 
            label: "Galeria",
            url: "/galeria"
        },
        { 
            label: "Ajuste",
            url: "/ajuste"
        }
    ]
    return <div className="flex flex-row items-center bg-linear-to-br from-blue-500 to-emerald-300
    m-3 rounded-2xl justify-around p-4">
        {
            ITEMS.map((item, index)=>(
                <a className="text-white font-semibold tracking-tighter text-base hover:scale-110 transition-all duration-300" href={item.url} key={index}>
                    {item.label}
                </a>
            ))
        }
    </div>
}
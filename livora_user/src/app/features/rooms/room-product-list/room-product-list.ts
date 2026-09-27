import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-room-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './room-product-list.html',
  styleUrl: './room-product-list.css'
})
export class RoomProductList implements OnInit {
  activeFilter: string | null = null;
  currentCategory: string = 'beds';
  currentRoom: string = 'bedroom';
  products: any[] = [];
  isBestSellerOnly: boolean = false;
  sortOption: string = '';

  constructor(private route: ActivatedRoute) {}
  get displayedProducts() {
    let result = [...this.products];

    if (this.isBestSellerOnly) {
      result = result.filter(p => p.badge === 'Best seller');
    }

    if (this.sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (this.sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  get bestSellerCount(): number {
    return this.products.filter(p => p.badge === 'Best seller').length;
  }

  get formattedRoomName(): string {
    return this.currentRoom.replace('-', ' ');
  }

  categoryDescriptions: Record<string, string> = {
    'beds': `We take getting a good night\'s sleep seriously, with hundreds of beds to prove it. We offer an extensive array of affordable bed frames to suit all budgets, styles and preferences. Ready for a restful refresh? Our wide selection of bed frames lets you find the perfect fit for your style and comfort. Explore our <span class="underline cursor-pointer font-medium text-gray-900">bed buying guide</span> to help you choose the perfect bed frame, or <span class="underline cursor-pointer font-medium text-gray-900">start planning your ideal bedroom</span> from scratch.`,
    'mattresses': `A good day starts with a good night\'s sleep. Explore our wide range of comfortable mattresses designed to support your body and give you the rest you deserve. Check out our <span class="underline cursor-pointer font-medium text-gray-900">mattress comfort guide</span>.`,
    'wardrobes': `Keep your bedroom clutter-free with our versatile wardrobes. From sliding doors to walk-in solutions, find the perfect storage for your style and space.`
  };

  get currentDescription(): string {
    return this.categoryDescriptions[this.currentCategory] || `Discover our wide range of ${this.currentCategory} designed to elevate your space and bring comfort to your everyday life.`;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const room = params.get('roomName');
      const category = params.get('categoryName');

      if (room) this.currentRoom = room;

      if (category) {
        this.currentCategory = category;
        this.products = this.mockDatabase[category] || [];
      }
    });
  }

  toggleFilter(filterName: string) {
    this.activeFilter = this.activeFilter === filterName ? null : filterName;
  }

  roomCategoriesMap: Record<string, any[]> = {
    'bedroom': [
      { id: 'beds', name: 'Beds', image: '/images/categories/bedroom/beds.png' },
      { id: 'mattresses', name: 'Mattresses', image: '/images/categories/bedroom/mattresses.png' },
      { id: 'wardrobes', name: 'Wardrobes', image: '/images/categories/bedroom/wardrobes.png' },
      { id: 'bedding', name: 'Bedding', image: '/images/categories/bedroom/bedding.png' },
      { id: 'blankets', name: 'Blankets', image: '/images/categories/bedroom/blankets.png' },
      { id: 'lighting', name: 'Lighting', image: '/images/categories/bedroom/lighting.png' }
    ],
    'living-room': [
      { id: 'sofas', name: 'Sofas', image: '/images/categories/living-room/sofas.png' },
      { id: 'armchairs', name: 'Armchairs', image: '/images/categories/living-room/armchairs.png' },
      { id: 'coffee-tables', name: 'Coffee Tables', image: '/images/categories/living-room/coffee-tables.png' },
      { id: 'tv-stands', name: 'TV Stands', image: '/images/categories/living-room/tv-stands.png' },
      { id: 'rugs', name: 'Rugs', image: '/images/categories/living-room/rugs.png' },
      { id: 'lighting', name: 'Lighting', image: '/images/categories/living-room/lighting.png' }
    ],
    'kitchen': [
      { id: 'cabinets', name: 'Cabinets', image: '/images/categories/kitchen/cabinets.png' },
      { id: 'dining-tables', name: 'Dining Tables', image: '/images/categories/kitchen/dining-tables.png' },
      { id: 'chairs', name: 'Chairs', image: '/images/categories/kitchen/chairs.png' },
      { id: 'lighting', name: 'Lighting', image: '/images/categories/kitchen/lighting.png' }
    ],
    'dining-room': [
      { id: 'dining-tables', name: 'Dining Tables', image: '/images/categories/kitchen/dining-tables.png' },
      { id: 'chairs', name: 'Chairs', image: '/images/categories/kitchen/chairs.png' },
      { id: 'sideboards', name: 'Sideboards', image: '/images/categories/dining-room/sideboards.png' },
      { id: 'lighting', name: 'Lighting', image: '/images/categories/kitchen/lighting.png' }
    ],
    'bathroom': [
      { id: 'mirrors', name: 'Mirrors', image: '/images/categories/bathroom/mirrors.png' },
      { id: 'cabinets', name: 'Cabinets', image: '/images/categories/bathroom/cabinets.png' },
      { id: 'towels', name: 'Towels', image: '/images/categories/bathroom/towels.png' },
      { id: 'lighting', name: 'Lighting', image: '/images/categories/bathroom/lighting.png' }
    ]
  };

  get subCategories() {
    return this.roomCategoriesMap[this.currentRoom] || this.roomCategoriesMap['bedroom'];
  }

  mockDatabase: Record<string, any[]> = {
    "beds": [
      { id: 1, name: "NEIDEN", description: "Compact design, perfect for tight spaces or under low ceilings.", price: 89, rating: 4.0, reviews: 120, badge: "Best seller", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" },
      { id: 2, name: "MALM", description: "A clean design that is just as beautiful on all sides.", price: 179, rating: 4.2, reviews: 310, badge: null, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" },
      { id: 3, name: "SLATTUM", description: "Upholstered in soft woven fabric that brings a cozy feeling.", price: 119, rating: 4.5, reviews: 45, badge: "Best seller", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80" }
    ],
    "mattresses": [
      { id: 4, name: "MALFORS", description: "Resilient foam mattress that keeps its shape and provides comfort.", price: 119, rating: 4.0, reviews: 312, badge: "Best seller", image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80" },
      { id: 5, name: "VESTMARKA", description: "Bonnell springs adapt to your body and provide steady support.", price: 150, rating: 4.2, reviews: 188, badge: null, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80" },
      { id: 6, name: "VADSO", description: "Individually wrapped pocket springs follow your movements.", price: 279, rating: 4.5, reviews: 96, badge: "Best seller", image: "https://images.unsplash.com/photo-1506720186575-11354d325017?q=80&w=1750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "wardrobes": [
      { id: 7, name: "PAX", description: "Flexible wardrobe frame that you can fit out exactly as you want.", price: 200, rating: 4.6, reviews: 540, badge: "Best seller", image: "https://images.unsplash.com/photo-1643949914877-b20f30792c1e?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 8, name: "BRIMNES", description: "Perfect for folded clothes as well as long and short garments.", price: 170, rating: 4.3, reviews: 276, badge: null, image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 9, name: "KLEPPSTAD", description: "Simple and smart wardrobe that fits in small bedrooms.", price: 130, rating: 4.0, reviews: 198, badge: "Best seller", image: "https://plus.unsplash.com/premium_photo-1676320514018-2f5b7c5a701f?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "bedding": [
      { id: 10, name: "DVALA", description: "Soft, easy-care cotton that feels comfortable against skin.", price: 20, rating: 4.5, reviews: 870, badge: "Best seller", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80" },
      { id: 11, name: "ANGSLILJA", description: "Densely woven cotton with a smooth, cool surface and sheen.", price: 35, rating: 4.6, reviews: 430, badge: null, image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80" },
      { id: 12, name: "NATTSVARMARE", description: "Warm beige tone and soft cotton blend bring a cozy feel.", price: 25, rating: 4.2, reviews: 120, badge: "Best seller", image: "https://images.unsplash.com/photo-1698746044395-85beb2b04522?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "blankets": [
      { id: 13, name: "INGABRITTA", description: "Soft, fluffy throw that adds a layer of warmth to your sofa.", price: 25, rating: 4.7, reviews: 610, badge: "Best seller", image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80" },
      { id: 14, name: "POLARVIDE", description: "Affordable fleece throw that is warm and easy to care for.", price: 4, rating: 4.3, reviews: 980, badge: null, image: "https://images.unsplash.com/photo-1601276174812-63280a55656e?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 15, name: "VARELD", description: "Lightweight cotton throw with a gentle drape and soft texture.", price: 20, rating: 4.5, reviews: 142, badge: "Best seller", image: "https://images.unsplash.com/photo-1601880348117-25c1127a95df?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "lighting": [
      { id: 16, name: "FADO", description: "Frosted glass shade spreads a soft, diffused glow in the room.", price: 19, rating: 4.6, reviews: 733, badge: "Best seller", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80" },
      { id: 17, name: "RANARP", description: "Classic adjustable work lamp directs light exactly where needed.", price: 45, rating: 4.5, reviews: 289, badge: null, image: "https://images.unsplash.com/photo-1585128719715-46776b56a0d1?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 18, name: "SYMFONISK", description: "Table lamp and WiFi speaker in one device.", price: 180, rating: 4.2, reviews: 156, badge: "Best seller", image: "https://images.unsplash.com/photo-1636368208791-17b81ed832d2?q=80&w=858&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "sofas": [
      { id: 19, name: "KIVIK", description: "Generous size, low armrests, and supportive pocket springs.", price: 549, rating: 4.5, reviews: 120, badge: "Best seller", image: "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 20, name: "SÖDERHAMN", description: "Stylish, low, and deep design with loose back cushions.", price: 499, rating: 4.2, reviews: 85, badge: null, image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80" },
      { id: 21, name: "LANDSKRONA", description: "Tufted design sofa in premium leather/fabric with wood legs.", price: 699, rating: 4.6, reviews: 64, badge: "Best seller", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80" }
    ],
    "armchairs": [
      { id: 22, name: "POÄNG", description: "Layer-glued bent birch frame provides comfortable resilience.", price: 89, rating: 4.6, reviews: 780, badge: "Best seller", image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 23, name: "STRANDMON", description: "Classic wing chair with high back providing neck support.", price: 129, rating: 4.7, reviews: 340, badge: null, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1316&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 24, name: "PELLO", description: "High back offers good support for your neck, simple styling.", price: 59, rating: 4.1, reviews: 520, badge: "Best seller", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }
    ],
    "coffee-tables": [
      { id: 25, name: "LACK", description: "Simple, clean-lined table, easy to move and place.", price: 19, rating: 4.1, reviews: 450, badge: "Best seller", image: "https://images.unsplash.com/photo-1534201569625-ed4662d8be97?q=80&w=822&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 26, name: "LISABO", description: "Sturdy table with ash veneer top and solid birch legs.", price: 99, rating: 4.4, reviews: 95, badge: null, image: "https://images.unsplash.com/photo-1619911013257-8f1fbc919fc9?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 27, name: "VITTSJÖ", description: "Tempered glass top is stain-resistant and easy to clean.", price: 49, rating: 4.5, reviews: 280, badge: "Best seller", image: "https://images.unsplash.com/photo-1647967527216-adea2f078e07?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "tv-stands": [
      { id: 28, name: "LACK", description: "Basic and functional TV stand with open back for easy cables.", price: 25, rating: 4.2, reviews: 340, badge: "Best seller", image: "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 29, name: "BESTÅ", description: "Sleek storage combination with push-open drawers.", price: 149, rating: 4.6, reviews: 180, badge: null, image: "https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 30, name: "BYÅS", description: "High-gloss white TV bench with adjustable shelving.", price: 89, rating: 4.3, reviews: 210, badge: "Best seller", image: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "rugs": [
      { id: 31, name: "TIPHEDE", description: "Lightweight flatwoven cotton rug, easy to shake out.", price: 35, rating: 4.4, reviews: 620, badge: "Best seller", image: "https://images.unsplash.com/photo-1586024486164-ce9b3d87e09f?q=80&w=1356&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 32, name: "STOENSE", description: "Thick, soft pile rug that dampens sound and is cozy.", price: 99, rating: 4.5, reviews: 210, badge: null, image: "https://images.unsplash.com/photo-1606885118474-c8baf907e998?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 33, name: "LOHALS", description: "Natural jute rug, durable and perfect for dining areas.", price: 69, rating: 4.2, reviews: 340, badge: "Best seller", image: "https://images.unsplash.com/photo-1580229080435-1c7e2ce835c1?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "cabinets": [
      { id: 34, name: "EKET", description: "Modular cube storage that can be wall-mounted or stacked.", price: 25, rating: 4.3, reviews: 230, badge: "Best seller", image: "https://images.unsplash.com/photo-1609241506098-80fc37c6325f?q=80&w=654&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 35, name: "KALLAX", description: "Classic shelving unit, can be placed vertically or horizontally.", price: 75, rating: 4.4, reviews: 140, badge: null, image: "https://images.unsplash.com/photo-1701421047855-d7bafd8d6f69?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 36, name: "BAGGEBO", description: "Clean glass cabinet to display your favorite items.", price: 35, rating: 4.1, reviews: 310, badge: "Best seller", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" }
    ],
    "dining-tables": [
      { id: 37, name: "EKEDALEN", description: "Durable extendable dining table with smart layout extension.", price: 129, rating: 4.4, reviews: 180, badge: "Best seller", image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80" },
      { id: 38, name: "JOKKMOKK", description: "Traditional pine dining table that comes with 4 matching chairs.", price: 79, rating: 4.1, reviews: 310, badge: null, image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=600&q=80" },
      { id: 39, name: "MELLTORP", description: "Simple, sturdy melamine table, resistant to liquids and scratches.", price: 49, rating: 4.0, reviews: 420, badge: "Best seller", image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "chairs": [
      { id: 40, name: "ODGER", description: "Ergonomic design with rounded bowl seat for comfort.", price: 45, rating: 4.5, reviews: 142, badge: "Best seller", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80" },
      { id: 41, name: "TEODORES", description: "Lightweight, stackable plastic chair, easy to clean.", price: 29, rating: 4.2, reviews: 280, badge: null, image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=600&q=80" },
      { id: 42, name: "ADDE", description: "Simple and affordable metal chair with plastic seat.", price: 15, rating: 3.9, reviews: 560, badge: "Best seller", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" }
    ],
    "sideboards": [
      { id: 43, name: "HAVSTA", description: "Solid wood sideboard with sliding doors and shelves.", price: 199, rating: 4.4, reviews: 95, badge: "Best seller", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80" },
      { id: 44, name: "BESTÅ", description: "Sleek modern sideboard combination with push-open drawers.", price: 249, rating: 4.5, reviews: 78, badge: null, image: "https://images.unsplash.com/photo-1713810958247-01dbd76b4a61?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 45, name: "LOMMARP", description: "Elegant dark green sideboard with traditional paneling.", price: 299, rating: 4.6, reviews: 45, badge: "Best seller", image: "https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "mirrors": [
      { id: 46, name: "HOVET", description: "Giant standing mirror that can be hung horizontally or vertically.", price: 149, rating: 4.6, reviews: 180, badge: "Best seller", image: "https://images.unsplash.com/photo-1663659504863-43dd69a5fda2?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 47, name: "TOFTBYN", description: "Classic mirror with a detailed, solid wood frame.", price: 69, rating: 4.4, reviews: 240, badge: null, image: "https://images.unsplash.com/photo-1712214741533-3dd5b8013ca7?q=80&w=1250&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 48, name: "NISSEDAL", description: "Minimalist wall mirror, perfect for checkups in the hallway.", price: 49, rating: 4.3, reviews: 310, badge: "Best seller", image: "https://images.unsplash.com/photo-1644916930530-0e4e5afdd20d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ],
    "towels": [
      { id: 49, name: "VÅGSJÖN", description: "Highly absorbent, thick, and durable bath towel.", price: 4, rating: 4.5, reviews: 320, badge: "Best seller", image: "https://images.unsplash.com/photo-1574421233376-06f2ccf017f7?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 50, name: "DIMFORSEN", description: "Soft waffle-textured hand towel, dries quickly.", price: 8, rating: 4.4, reviews: 180, badge: null, image: "https://images.unsplash.com/photo-1621468644541-deea173bd43e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
      { id: 51, name: "NÄRSEN", description: "Affordable guest towel, lightweight and packable.", price: 2, rating: 3.8, reviews: 410, badge: "Best seller", image: "https://images.unsplash.com/photo-1638232928539-6e91c47ddec5?q=80&w=830&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
    ]
  };
}

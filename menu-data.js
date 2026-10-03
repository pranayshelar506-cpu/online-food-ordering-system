// Menu data: "Name price" ; a trailing * marks non-veg
const C=[['Hot Coffee','🥤',25,'Espresso 120,Americano 140,Cappuccino 170,Café Latte 180,Flat White 190,Mocha 200,Caramel Macchiato 210,Irish Hazelnut Latte 220,South Indian Filter Coffee 110,Masala Chai Coffee 150'],
['Cold Coffee & Shakes','🧋',210,'Classic Cold Coffee 180,Iced Latte 190,Frappé 220,Oreo Shake 230,Chocolate Shake 220,Mango Shake 210,Strawberry Shake 210,Cold Brew 200'],
['Tea','🍵',90,'Masala Chai 80,Kulhad Chai 90,Ginger Tea 80,Green Tea 100,Iced Lemon Tea 130,Peach Iced Tea 140,Kashmiri Kahwa 150'],
['Breakfast','🥞',35,'Aloo Paratha with Curd 140,Poha 90,Masala Omelette* 120,Pancakes with Maple Syrup 190,French Toast 170,Avocado Toast 230'],
['Sandwiches & Burgers','🥪',45,'Veg Grilled Sandwich 150,Paneer Tikka Sandwich 190,Chicken Club Sandwich* 230,Veg Burger 170,Chicken Burger* 210'],
['Pizza & Pasta','🍕',10,'White Sauce Pasta 240,Red Sauce Pasta 230,Margherita Pizza 280,Farmhouse Pizza 340,Chicken Peri-Peri Pizza* 380'],
['Snacks','🍟',48,'French Fries 130,Peri-Peri Fries 150,Garlic Bread with Cheese 160,Nachos with Dip 190,Veg Momos 140,Chicken Momos* 170,Samosa Chaat 110,Vada Pav 70'],
['Desserts','🍰',330,'Brownie with Ice Cream 210,Tiramisu 250,Cheesecake 240,Gulab Jamun 110,Waffles 200,Red Velvet Pastry 180'],
['Combos','🎁',130,'Musafir Breakfast Combo 349,Couple Combo 599,Friends Combo 999,Student Combo 249']];
const M=[];C.forEach(([c,e,h,s])=>s.split(',').forEach(t=>{const m=t.match(/^(.*?)(\*?) (\d+)$/);const id=M.length;M.push({id,n:m[1],nv:!!m[2],p:+m[3],c,e,h,r:(3.8+(id*7%12)/10).toFixed(1),b:id%5==0})}));
const COUP={WELCOME10:[.1,0],MUSAFIR20:[.2,500]};
if(typeof module!=='undefined')module.exports={C,M,COUP};

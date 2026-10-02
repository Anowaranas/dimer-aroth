const fs = require('fs');
const file = 'src/components/PartyDetailsModal.tsx';
let text = fs.readFileSync(file, 'utf8');

const startTag = '{/* ২. সিরিয়ালে চিকন লাইনসমূহ: মোট ডিমের দাম, পূর্বের বাকি, নগদ জমা ও অবশিষ্ট বাকি */}';
const endComment = '{/* Bottom Footer Action Buttons matching AllMemosView */}';

const startIndex = text.indexOf(startTag);
const endIndex = text.indexOf(endComment);

if (startIndex === -1 || endIndex === -1) {
  console.log('Error: tags not found', { startIndex, endIndex });
  process.exit(1);
}

const before = text.substring(0, startIndex);
const after = text.substring(endIndex);

const replacement = `{/* ২. সিরিয়ালে চিকন লাইনসমূহ: মোট ডিমের দাম, পূর্বের বাকি, মোট দাবি, নগদ জমা ও অবশিষ্ট বাকি */}
                        <div className="space-y-1 pt-1 border-t border-slate-200/80 dark:border-slate-700/80">
                          {/* লাইন ১: আজকের মোট বিল */}
                          <div className="flex items-center justify-between text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                🥚
                              </span>
                              <span className="truncate">আজকের মোট বিল</span>
                            </div>
                            <span className="font-black text-slate-950 dark:text-white tabular-nums shrink-0 ml-2">
                              = {toBnCurrency(memo.totalBill, useBengali)}
                            </span>
                          </div>

                          {/* লাইন ২: সাবেক বাকি (পূর্বের দেনা) */}
                          <div className="flex items-center justify-between text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg border bg-rose-50/80 dark:bg-rose-950/30 border-rose-250 dark:border-rose-850 text-rose-900 dark:text-rose-200">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                +
                              </span>
                              <span className="truncate">সাবেক বাকি (পূর্বের জের)</span>
                            </div>
                            <span className="font-black text-rose-700 dark:text-rose-300 tabular-nums shrink-0 ml-2">
                              {memo.previousDue > 0 ? \`+\${toBnCurrency(memo.previousDue, useBengali)}\` : '০ ৳'}
                            </span>
                          </div>

                          {/* লাইন ৩: সর্বমোট দাবি */}
                          <div className="flex items-center justify-between text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg border bg-amber-50/80 dark:bg-amber-950/30 border-amber-250 dark:border-amber-850 text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                =
                              </span>
                              <span className="truncate">সর্বমোট দাবি</span>
                            </div>
                            <span className="font-black text-amber-700 dark:text-amber-300 tabular-nums shrink-0 ml-2">
                              = {toBnCurrency(memo.totalDemand, useBengali)}
                            </span>
                          </div>

                          {/* লাইন ৪: নগদ জমা (আদায়কৃত টাকা) */}
                          <div className="flex items-center justify-between text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-250 dark:border-emerald-850 text-emerald-900 dark:text-emerald-200">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                -
                              </span>
                              <span className="truncate">নগদ জমা (পরিশোধ)</span>
                            </div>
                            <span className="font-black text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0 ml-2">
                              {memo.cashPaid > 0 ? \`-\${toBnCurrency(memo.cashPaid, useBengali)}\` : '০ ৳'}
                            </span>
                          </div>

                          {/* লাইন ৫: অবশিষ্ট বাকি (জের) */}
                          <div className={\`flex items-center justify-between text-xs sm:text-sm font-black px-2.5 py-1.5 rounded-lg border-2 \${
                            memo.remainingDue > 0
                              ? 'bg-rose-100/80 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-100'
                              : 'bg-emerald-100/80 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100'
                          }\`}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className={\`w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-black shrink-0 \${memo.remainingDue > 0 ? 'bg-rose-700' : 'bg-emerald-700'}\`}>
                                =
                              </span>
                              <span className="truncate">
                                {memo.remainingDue > 0 ? 'অবশিষ্ট বাকি (জের)' : 'হিসাব পরিশোধিত'}
                              </span>
                            </div>
                            <span className="font-black text-sm sm:text-base tabular-nums shrink-0 ml-2">
                              {memo.remainingDue > 0 ? toBnCurrency(memo.remainingDue, useBengali) : '০ ৳'}
                            </span>
                          </div>
                        </div>
                      </div>
                      `;

fs.writeFileSync(file, before + replacement + after, 'utf8');
console.log('Update PartyDetailsModal success!');

// Liste -> Map(id, item) dönüşümü için memoize edilmiş hook.
// IncomeTab/CustomersTab/SalesTab içinde tekrar eden kalıbı tek noktaya taşır.
//
//   const customerMap = useEntityMap(customers);
//   customerMap.get('cust-1') // -> { id, name, ... } | undefined

const { useMemo } = React;

export function useEntityMap(list, keyField = 'id') {
    return useMemo(() => {
        const map = new Map();
        if (!Array.isArray(list)) return map;
        for (const item of list) {
            if (item && item[keyField] != null) map.set(item[keyField], item);
        }
        return map;
    }, [list, keyField]);
}
